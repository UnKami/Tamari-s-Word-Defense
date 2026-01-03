
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import {
  TowerType,
  Point,
  EnemyData,
  BossData,
  TowerData,
  GameState,
  DefeatedEffect,
  MissedEffect,
  WordDetail
} from './types';
import {
  GRID_SIZE,
  PATH,
  INITIAL_HEALTH,
  INITIAL_COINS,
  TOWER_STATS,
  WORD_LIST
} from './constants';
import GameBoard from './components/GameBoard';
import UIOverlay from './components/UIOverlay';
import Keyboard from './components/Keyboard';
import UpgradeMenu from './components/UpgradeMenu';
import Grimoire from './components/Grimoire';
import { supabase } from './src/supabaseClient';
import { Auth } from './src/components/Auth';
import type { User } from '@supabase/supabase-js';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [gameState, setGameState] = useState<GameState>({
    health: INITIAL_HEALTH,
    coins: INITIAL_COINS,
    wave: 0,
    isWaveActive: false,
    waveInterval: 5.0,
    enemies: [],
    boss: null,
    towers: [],
    defeatedEffects: [],
    missedEffects: [],
    grimoire: {}
  });

  const [selectedSlot, setSelectedSlot] = useState<Point | null>(null);
  const [showUpgradeMenu, setShowUpgradeMenu] = useState(false);
  const [showGrimoire, setShowGrimoire] = useState(false);
  
  const gameLoopRef = useRef<number>(null);
  const lastUpdateRef = useRef<number>(performance.now());
  const spawnTimerRef = useRef<number>(0);
  const enemiesToSpawnRef = useRef<number>(0);

  const fetchWordDetails = async (word: string, retries = 3, backoff = 2000): Promise<Partial<WordDetail>> => {
    // Check localStorage cache first
    const cacheKey = `tamari_word_${word.toLowerCase()}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        localStorage.removeItem(cacheKey);
      }
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Provide a simple dictionary definition, part of speech, a simple example sentence, and a very short etymology (history) for the word: "${word}". 
        
        CRITICAL: Use very simple beginner-level English (A1-A2 level). Avoid complex academic words.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              definition: { type: Type.STRING },
              partOfSpeech: { type: Type.STRING },
              example: { type: Type.STRING },
              etymology: { type: Type.STRING }
            },
            required: ["definition", "partOfSpeech", "example", "etymology"]
          }
        }
      });
      
      const result = JSON.parse(response.text || '{}');
      if (result.definition) {
        localStorage.setItem(cacheKey, JSON.stringify(result));
      }
      return result;
    } catch (error: any) {
      // Handle rate limits (429) or resource exhaustion
      const isRateLimit = error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED');
      
      if (isRateLimit && retries > 0) {
        console.warn(`Rate limit hit for word: ${word}. Retrying in ${backoff}ms... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, backoff));
        return fetchWordDetails(word, retries - 1, backoff * 2);
      }

      console.error("Failed to fetch word details", error);
      return { 
        definition: "A useful word for communication.", 
        partOfSpeech: "noun", 
        example: `The ${word.toLowerCase()} is important.`, 
        etymology: "Root unknown." 
      };
    }
  };

  const recordDefeatedWord = useCallback(async (word: string) => {
    // Attack power is word length + rare letter bonus (Q, X, Z)
    const rareBonus = (word.match(/[QXZ]/gi) || []).length * 5;
    const basePower = word.length * 2 + rareBonus;

    setGameState(prev => {
      const existing = prev.grimoire[word];
      if (existing) {
        return {
          ...prev,
          grimoire: {
            ...prev.grimoire,
            [word]: { ...existing, defeatCount: existing.defeatCount + 1 }
          }
        };
      }

      return {
        ...prev,
        grimoire: {
          ...prev.grimoire,
          [word]: {
            word,
            definition: "Loading...",
            partOfSpeech: "",
            example: "",
            defeatCount: 1,
            rewardClaimed: false,
            attackPower: basePower
          }
        }
      };
    });

    const details = await fetchWordDetails(word);
    setGameState(prev => ({
      ...prev,
      grimoire: {
        ...prev.grimoire,
        [word]: {
          ...prev.grimoire[word],
          ...details
        }
      }
    }));

    // Save to database
    if (user) {
      try {
        // Check if word already exists
        const { data: existing, error: selectError } = await supabase
          .from('grimoire_entries')
          .select('*')
          .eq('user_id', user.id)
          .eq('word', word)
          .maybeSingle();

        if (existing) {
          // Word exists, increment defeat_count
          await supabase
            .from('grimoire_entries')
            .update({
              defeat_count: existing.defeat_count + 1,
              definition: details.definition || existing.definition,
              part_of_speech: details.partOfSpeech || existing.part_of_speech,
              example: details.example || existing.example,
              etymology: details.etymology || existing.etymology,
            })
            .eq('user_id', user.id)
            .eq('word', word);
        } else {
          // New word, insert it
          const { error: insertError } = await supabase
            .from('grimoire_entries')
            .insert({
              user_id: user.id,
              word,
              definition: details.definition || "Loading...",
              part_of_speech: details.partOfSpeech || "",
              example: details.example || "",
              etymology: details.etymology || "",
              attack_power: basePower,
              defeat_count: 1,
              reward_claimed: false
            });

          if (insertError) {
            console.error('Error inserting grimoire entry:', insertError);
          }
        }
      } catch (error) {
        console.error('Error saving grimoire entry:', error);
      }
    }
  }, [user]);

  const claimGrimoireReward = useCallback((word: string) => {
    setGameState(prev => {
      const wordDetail = prev.grimoire[word];
      if (!wordDetail || wordDetail.rewardClaimed) return prev;

      // Save to database
      if (user) {
        supabase
          .from('grimoire_entries')
          .update({ reward_claimed: true })
          .eq('user_id', user.id)
          .eq('word', word);
      }

      return {
        ...prev,
        coins: prev.coins + 10,
        grimoire: {
          ...prev.grimoire,
          [word]: { ...wordDetail, rewardClaimed: true }
        }
      };
    });
  }, [user]);

  const getWaveStats = (wave: number) => {
    if (wave % 5 === 0) return { isBoss: true, hp: wave * 50 };
    if (wave <= 1) return { words: 3, interval: 5.0 };
    const interval = 5.0 - Math.floor(wave / 2) * 0.2;
    let words = 0;
    if (wave % 2 === 0) {
      words = (wave / 2) + 2;
    } else {
      words = ((wave - 1) / 2) + 5;
    }
    return { words, interval: Math.max(0.4, interval) };
  };

  const getPathPos = (progress: number): Point => {
    const segments = PATH.length - 1;
    const t = Math.max(0, Math.min(progress * segments, segments - 0.0001));
    const segmentIdx = Math.floor(t);
    const segmentT = t - segmentIdx;
    
    const p1 = PATH[segmentIdx];
    const p2 = PATH[segmentIdx + 1];
    
    return {
      x: p1.x + (p2.x - p1.x) * segmentT,
      y: p1.y + (p2.y - p1.y) * segmentT
    };
  };

  const getNextBossWord = useCallback((grimoire: Record<string, WordDetail>) => {
    const knownWords = Object.keys(grimoire);
    if (knownWords.length === 0) return WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
    return knownWords[Math.floor(Math.random() * knownWords.length)];
  }, []);

  const spawnEnemy = useCallback(() => {
    const randomWord = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
    const missingCount = Math.random() > 0.7 ? 2 : 1;
    const indices = Array.from({ length: randomWord.length }, (_, i) => i);
    const shuffled = indices.sort(() => 0.5 - Math.random());
    const missingIndices = shuffled.slice(0, Math.min(missingCount, randomWord.length - 1)).sort((a, b) => a - b);
    
    let display = "";
    for (let i = 0; i < randomWord.length; i++) {
      display += missingIndices.includes(i) ? "_" : randomWord[i];
    }

    const newEnemy: EnemyData = {
      id: Math.random().toString(36).substr(2, 9),
      fullWord: randomWord,
      displayWord: display,
      missingIndices,
      progress: 0,
      isSlowed: false,
      slowTimer: 0
    };

    setGameState(prev => ({
      ...prev,
      enemies: [...prev.enemies, newEnemy]
    }));
  }, []);

  const handleKeyPress = useCallback((char: string) => {
    setGameState(prev => {
      if (!prev.isWaveActive || prev.isVictorySequenceActive) return prev;

      // BOSS MODE INPUT
      if (prev.boss) {
        const boss = prev.boss;
        if (boss.isDying) return prev;

        const target = boss.targetWord;
        const expectedChar = target[boss.typedPart.length];

        if (char === expectedChar) {
          const newTyped = boss.typedPart + char;
          if (newTyped === target) {
            // Collection bonus logic
            const wordData = prev.grimoire[target];
            const wordPower = wordData ? wordData.attackPower : target.length * 2;
            const collectionBonus = 1 + (Object.keys(prev.grimoire).length * 0.02);
            const totalDamage = Math.floor(wordPower * collectionBonus);

            const newHp = Math.max(0, boss.hp - totalDamage);
            const isDefeated = newHp <= 0;
            
            if (isDefeated) {
              setTimeout(() => {
                setGameState(s => ({
                  ...s,
                  boss: null,
                  isWaveActive: false,
                  isVictorySequenceActive: false,
                  coins: s.coins + 500
                }));
              }, 3500);

              return {
                ...prev,
                isVictorySequenceActive: true,
                boss: { ...boss, hp: 0, isDying: true },
                defeatedEffects: [
                  ...prev.defeatedEffects,
                  {
                    id: Math.random().toString(),
                    pos: getPathPos(boss.progress),
                    coins: 500,
                    word: "ANNIHILATED",
                    startTime: Date.now(),
                    isBoss: true
                  }
                ]
              };
            }

            return {
              ...prev,
              boss: {
                ...boss,
                hp: newHp,
                typedPart: "",
                targetWord: getNextBossWord(prev.grimoire)
              },
              coins: prev.coins + 10,
              defeatedEffects: [
                ...prev.defeatedEffects,
                {
                  id: Math.random().toString(),
                  pos: getPathPos(boss.progress),
                  coins: 10,
                  word: `CRITICAL! -${totalDamage} HP`,
                  startTime: Date.now()
                }
              ]
            };
          } else {
            return {
              ...prev,
              boss: { ...boss, typedPart: newTyped }
            };
          }
        }
        return prev;
      }

      // NORMAL MODE INPUT
      if (prev.enemies.length === 0) return prev;
      const sortedEnemies = [...prev.enemies].sort((a, b) => b.progress - a.progress);
      let updatedEnemies = [...prev.enemies];
      let coinsGained = 0;
      let defeatedEnemy: EnemyData | null = null;

      for (const enemy of sortedEnemies) {
        const firstMissingIdx = enemy.missingIndices[0];
        if (enemy.fullWord[firstMissingIdx] === char) {
          const newDisplay = enemy.displayWord.split('');
          newDisplay[firstMissingIdx] = char;
          const newMissing = enemy.missingIndices.slice(1);
          
          if (newMissing.length === 0) {
            updatedEnemies = updatedEnemies.filter(e => e.id !== enemy.id);
            coinsGained = 20 + prev.wave * 5;
            defeatedEnemy = enemy;
            recordDefeatedWord(enemy.fullWord);
          } else {
            updatedEnemies = updatedEnemies.map(e => e.id === enemy.id ? {
              ...e,
              displayWord: newDisplay.join(''),
              missingIndices: newMissing
            } : e);
          }
          
          const newDefeatedEffects = defeatedEnemy ? [
            ...prev.defeatedEffects,
            {
              id: Math.random().toString(),
              pos: getPathPos(defeatedEnemy.progress),
              coins: coinsGained,
              word: defeatedEnemy.fullWord,
              startTime: Date.now()
            }
          ] : prev.defeatedEffects;

          const isWaveFinished = enemiesToSpawnRef.current === 0 && updatedEnemies.length === 0;

          return {
            ...prev,
            enemies: updatedEnemies,
            coins: prev.coins + coinsGained,
            isWaveActive: !isWaveFinished,
            defeatedEffects: newDefeatedEffects
          };
        }
      }
      return prev;
    });
  }, [recordDefeatedWord, getNextBossWord]);

  const update = useCallback((time: number) => {
    const dt = (time - lastUpdateRef.current) / 1000;
    lastUpdateRef.current = time;

    setGameState(prev => {
      const now = Date.now();
      let nextHealth = prev.health;
      let nextEnemies = [...prev.enemies];
      let nextBoss = prev.boss ? { ...prev.boss } : null;
      const nextTowers = [...prev.towers];
      let coinsGained = 0;
      let newDefeatedEffects = prev.defeatedEffects.filter(eff => now - eff.startTime < 4000);
      let newMissedEffects = prev.missedEffects.filter(eff => now - eff.startTime < 3000);

      if (!prev.isWaveActive && !prev.isVictorySequenceActive) {
        return { ...prev, defeatedEffects: newDefeatedEffects, missedEffects: newMissedEffects };
      }

      if (!prev.boss && prev.isWaveActive) {
        spawnTimerRef.current += dt;
        if (enemiesToSpawnRef.current > 0 && spawnTimerRef.current >= prev.waveInterval) {
          spawnTimerRef.current = 0;
          enemiesToSpawnRef.current--;
          setTimeout(() => spawnEnemy(), 0);
        }
      }

      nextTowers.forEach(tower => {
        const stats = TOWER_STATS[tower.type];
        const effectVal = stats.effectValue(tower.level);

        if (tower.type === TowerType.AUTOFILL) {
          if (now - tower.lastActionTime > effectVal * 1000) {
            if (prev.boss) {
               if (prev.boss.isDying) return;
               const pos = getPathPos(prev.boss.progress);
               const dist = Math.sqrt(Math.pow(pos.x - tower.gridPos.x, 2) + Math.pow(pos.y - tower.gridPos.y, 2));
               if (dist <= stats.range) {
                 if (nextBoss) nextBoss.hp = Math.max(0, nextBoss.hp - 5);
                 tower.lastActionTime = now;
               }
            } else {
              const target = nextEnemies.find(e => {
                const pos = getPathPos(e.progress);
                const dist = Math.sqrt(Math.pow(pos.x - tower.gridPos.x, 2) + Math.pow(pos.y - tower.gridPos.y, 2));
                return dist <= stats.range;
              });

              if (target) {
                const missingIdx = target.missingIndices[0];
                const char = target.fullWord[missingIdx];
                const newDisplay = target.displayWord.split('');
                newDisplay[missingIdx] = char;
                const newMissing = target.missingIndices.slice(1);

                if (newMissing.length === 0) {
                  nextEnemies = nextEnemies.filter(e => e.id !== target.id);
                  coinsGained += 20;
                  newDefeatedEffects.push({
                     id: Math.random().toString(),
                     pos: getPathPos(target.progress),
                     coins: 20,
                     word: target.fullWord,
                     startTime: now
                  });
                  recordDefeatedWord(target.fullWord);
                } else {
                  nextEnemies = nextEnemies.map(e => e.id === target.id ? {
                    ...e,
                    displayWord: newDisplay.join(''),
                    missingIndices: newMissing
                  } : e);
                }
                tower.lastActionTime = now;
              }
            }
          }
        }
      });

      if (nextBoss && !nextBoss.isDying) {
        let slowFactor = 1.0;
        nextTowers.filter(t => t.type === TowerType.SLOW).forEach(t => {
          const pos = getPathPos(nextBoss!.progress);
          const dist = Math.sqrt(Math.pow(pos.x - t.gridPos.x, 2) + Math.pow(pos.y - t.gridPos.y, 2));
          if (dist <= TOWER_STATS[TowerType.SLOW].range) {
            slowFactor = Math.min(slowFactor, TOWER_STATS[TowerType.SLOW].effectValue(t.level));
          }
        });
        nextBoss.progress += 0.015 * slowFactor * dt;
        if (nextBoss.progress >= 1) {
          nextHealth -= 5;
          newMissedEffects.push({ id: 'boss-breach', word: 'BOSS BREACH', startTime: now });
          nextBoss = null;
        }
      }

      nextEnemies = nextEnemies.map(enemy => {
        let slowFactor = 1.0;
        nextTowers.filter(t => t.type === TowerType.SLOW).forEach(t => {
          const pos = getPathPos(enemy.progress);
          const dist = Math.sqrt(Math.pow(pos.x - t.gridPos.x, 2) + Math.pow(pos.y - t.gridPos.y, 2));
          if (dist <= TOWER_STATS[TowerType.SLOW].range) {
            slowFactor = Math.min(slowFactor, TOWER_STATS[TowerType.SLOW].effectValue(t.level));
          }
        });

        const speed = 0.05 * slowFactor;
        const newProgress = enemy.progress + speed * dt;
        return { ...enemy, progress: newProgress };
      });

      const reachedEnemies = nextEnemies.filter(e => e.progress >= 1);
      if (reachedEnemies.length > 0) {
        nextHealth -= reachedEnemies.length;
        reachedEnemies.forEach(e => {
          newMissedEffects.push({
            id: Math.random().toString(),
            word: e.fullWord,
            startTime: now
          });
        });
        nextEnemies = nextEnemies.filter(e => e.progress < 1);
      }

      let nextIsWaveActive = prev.isWaveActive;
      if (enemiesToSpawnRef.current === 0 && nextEnemies.length === 0 && !nextBoss && !prev.isVictorySequenceActive) {
        nextIsWaveActive = false;
      }

      if (nextHealth <= 0) {
        return { ...prev, health: 0, isWaveActive: false, enemies: [], boss: null, defeatedEffects: [], missedEffects: newMissedEffects };
      }

      return {
        ...prev,
        health: nextHealth,
        enemies: nextEnemies,
        boss: nextBoss,
        towers: nextTowers,
        coins: prev.coins + coinsGained,
        isWaveActive: nextIsWaveActive,
        defeatedEffects: newDefeatedEffects,
        missedEffects: newMissedEffects
      };
    });

    gameLoopRef.current = requestAnimationFrame(update);
  }, [spawnEnemy, recordDefeatedWord]);

  useEffect(() => {
    gameLoopRef.current = requestAnimationFrame(update);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [update]);

  // Check authentication on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load game from database when user is authenticated
  useEffect(() => {
    if (!user) return;

    const loadGame = async () => {
      try {
        // Load game save
        const { data: saveData, error: saveError } = await supabase
          .from('game_saves')
          .select('*')
          .eq('user_id', user.id)
          .single();

        // Load grimoire entries
        const { data: grimoireData, error: grimoireError } = await supabase
          .from('grimoire_entries')
          .select('*')
          .eq('user_id', user.id);

        if (saveData && !saveError) {
          const grimoire: Record<string, WordDetail> = {};

          if (grimoireData && !grimoireError) {
            grimoireData.forEach((entry: any) => {
              grimoire[entry.word] = {
                word: entry.word,
                definition: entry.definition || "",
                partOfSpeech: entry.part_of_speech || "",
                example: entry.example || "",
                etymology: entry.etymology || "",
                defeatCount: entry.defeat_count,
                rewardClaimed: entry.reward_claimed,
                attackPower: entry.attack_power
              };
            });
          }

          setGameState({
            health: saveData.health,
            coins: saveData.coins,
            wave: saveData.wave,
            isWaveActive: saveData.is_wave_active,
            waveInterval: 5.0,
            enemies: [],
            boss: null,
            towers: saveData.towers || [],
            defeatedEffects: [],
            missedEffects: [],
            grimoire
          });
        }
      } catch (error) {
        console.error('Error loading game:', error);
      }
    };

    loadGame();
  }, [user]);

  // Auto-save game state to database (debounced)
  // Note: Towers are excluded from dependencies because lastActionTime updates every frame
  useEffect(() => {
    if (!user || loading) return;

    const saveGame = async () => {
      try {
        await supabase
          .from('game_saves')
          .update({
            health: gameState.health,
            coins: gameState.coins,
            wave: gameState.wave,
            towers: gameState.towers,
            is_wave_active: gameState.isWaveActive,
          })
          .eq('user_id', user.id);
      } catch (error) {
        console.error('Error saving game:', error);
      }
    };

    // Debounce save by 3 seconds to reduce database calls
    const timeoutId = setTimeout(saveGame, 3000);
    return () => clearTimeout(timeoutId);
  }, [user, loading, gameState.health, gameState.coins, gameState.wave, gameState.isWaveActive]);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const handleRestart = useCallback(async () => {
    if (user) {
      // Reset game save in database
      await supabase
        .from('game_saves')
        .update({
          health: INITIAL_HEALTH,
          coins: INITIAL_COINS,
          wave: 0,
          towers: [],
          is_wave_active: false,
        })
        .eq('user_id', user.id);

      // Delete all grimoire entries
      await supabase
        .from('grimoire_entries')
        .delete()
        .eq('user_id', user.id);
    }

    // Reset local game state
    setGameState({
      health: INITIAL_HEALTH,
      coins: INITIAL_COINS,
      wave: 0,
      isWaveActive: false,
      waveInterval: 5.0,
      enemies: [],
      boss: null,
      towers: [],
      defeatedEffects: [],
      missedEffects: [],
      grimoire: {}
    });
  }, [user]);

  const startWave = useCallback(() => {
    if (gameState.isWaveActive) return;
    const nextWave = gameState.wave + 1;
    const stats: any = getWaveStats(nextWave);
    
    if (stats.isBoss) {
      setGameState(prev => ({
        ...prev,
        wave: nextWave,
        isWaveActive: true,
        enemies: [],
        boss: {
          hp: stats.hp,
          maxHp: stats.hp,
          progress: 0,
          targetWord: getNextBossWord(prev.grimoire),
          typedPart: ""
        }
      }));
    } else {
      enemiesToSpawnRef.current = stats.words;
      spawnTimerRef.current = stats.interval;
      setGameState(prev => ({
        ...prev,
        wave: nextWave,
        isWaveActive: true,
        waveInterval: stats.interval,
        enemies: [],
        boss: null
      }));
    }
  }, [gameState.isWaveActive, gameState.wave, getNextBossWord]);

  const buildTower = useCallback((type: TowerType) => {
    if (!selectedSlot) return;
    const cost = TOWER_STATS[type].cost;
    if (gameState.coins < cost) return;

    const newTower: TowerData = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      gridPos: selectedSlot,
      level: 1,
      lastActionTime: 0,
      range: TOWER_STATS[type].range
    };

    setGameState(prev => {
      const newState = {
        ...prev,
        coins: prev.coins - cost,
        towers: [...prev.towers, newTower]
      };

      // Immediately save towers to database
      if (user) {
        supabase
          .from('game_saves')
          .update({ towers: newState.towers, coins: newState.coins })
          .eq('user_id', user.id);
      }

      return newState;
    });
    setSelectedSlot(null);
  }, [selectedSlot, gameState.coins, user]);

  const upgradeTower = useCallback((id: string) => {
    const tower = gameState.towers.find(t => t.id === id);
    if (!tower) return;
    const cost = TOWER_STATS[tower.type].upgradeCost(tower.level);
    if (gameState.coins < cost) return;

    setGameState(prev => {
      const newState = {
        ...prev,
        coins: prev.coins - cost,
        towers: prev.towers.map(t => t.id === id ? { ...t, level: t.level + 1 } : t)
      };

      // Immediately save towers to database
      if (user) {
        supabase
          .from('game_saves')
          .update({ towers: newState.towers, coins: newState.coins })
          .eq('user_id', user.id);
      }

      return newState;
    });
  }, [gameState.towers, gameState.coins, user]);

  // Show loading or auth screen
  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Auth onAuthSuccess={() => setLoading(false)} />;
  }

  return (
    <div className={`relative h-screen w-screen overflow-hidden flex flex-col bg-slate-900 text-white select-none p-2 sm:p-4 ${gameState.isVictorySequenceActive ? 'animate-screen-shake' : ''}`}>
      <UIOverlay
        health={gameState.health}
        coins={gameState.coins}
        wave={gameState.wave}
        isWaveActive={gameState.isWaveActive}
        onStartWave={startWave}
        onOpenUpgrades={() => setShowUpgradeMenu(true)}
        onOpenGrimoire={() => setShowGrimoire(true)}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col items-center justify-center min-h-0 w-full relative">
        {gameState.health <= 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center animate-bounce">
            <h1 className="text-6xl bungee text-red-500 mb-4">GAME OVER</h1>
            <button onClick={handleRestart} className="bg-white text-black px-8 py-4 rounded-full font-bold">RESTART</button>
          </div>
        ) : (
          <>
            <div className="flex-1 w-full flex items-center justify-center p-2 sm:p-4 overflow-hidden">
              <img 
                src="https://i.ibb.co/Zp8VpqCv/Generated-Image-December-31-2025-1-24-AM-removebg-preview.png" 
                alt="Save Tamar's Castle" 
                className="max-h-full max-w-full object-contain animate-pulse drop-shadow-[0_5px_15px_rgba(236,72,153,0.3)]"
              />
            </div>

            <div className="relative aspect-square w-full max-w-full sm:max-w-[65vh] bg-slate-800 rounded-xl shadow-2xl overflow-hidden border-4 border-slate-700">
              <GameBoard 
                towers={gameState.towers}
                enemies={gameState.enemies}
                boss={gameState.boss}
                defeatedEffects={gameState.defeatedEffects}
                missedEffects={gameState.missedEffects}
                getPathPos={getPathPos}
                selectedSlot={selectedSlot}
                onSlotClick={setSelectedSlot}
              />

              {selectedSlot && !gameState.isWaveActive && (
                <div 
                  className="absolute z-50 bg-slate-900/95 p-2 rounded-lg border border-slate-600 flex flex-col gap-1 shadow-xl animate-in fade-in zoom-in duration-200"
                  style={{ 
                    left: `${(selectedSlot.x / GRID_SIZE) * 100}%`, 
                    top: `${(selectedSlot.y / GRID_SIZE) * 100}%`,
                    transform: 'translate(-50%, -110%)' 
                  }}
                >
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Build</div>
                  <button 
                    onClick={() => buildTower(TowerType.SLOW)}
                    disabled={gameState.coins < TOWER_STATS[TowerType.SLOW].cost}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-2 py-1 rounded transition-all whitespace-nowrap"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-300" />
                    <div className="text-xs font-semibold">Slow ({TOWER_STATS[TowerType.SLOW].cost}¢)</div>
                  </button>
                  <button 
                    onClick={() => buildTower(TowerType.AUTOFILL)}
                    disabled={gameState.coins < TOWER_STATS[TowerType.AUTOFILL].cost}
                    className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 px-2 py-1 rounded transition-all whitespace-nowrap"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-300" />
                    <div className="text-xs font-semibold">Auto ({TOWER_STATS[TowerType.AUTOFILL].cost}¢)</div>
                  </button>
                  <button 
                    onClick={() => setSelectedSlot(null)}
                    className="text-[9px] text-slate-500 hover:text-white transition-colors mt-1 text-center"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className={`transition-all duration-300 mt-2 ${gameState.isWaveActive ? 'opacity-100 translate-y-0 h-auto' : 'opacity-0 translate-y-10 h-0 overflow-hidden'}`}>
        {gameState.boss && !gameState.boss.isDying && (
          <div className="flex flex-col items-center mb-2 animate-in slide-in-from-bottom duration-500">
            <div className="text-[10px] text-pink-400 font-black uppercase tracking-widest mb-1 bungee">Boss Attack Target:</div>
            <div className="bg-white/10 backdrop-blur-xl border-2 border-pink-500 p-3 rounded-2xl flex gap-1 shadow-[0_0_20px_rgba(236,72,153,0.4)]">
               {gameState.boss.targetWord.split('').map((char, i) => (
                 <span key={i} className={`text-2xl font-black transition-colors ${i < gameState.boss!.typedPart.length ? 'text-pink-400 drop-shadow-glow' : 'text-slate-500'}`}>
                    {char}
                 </span>
               ))}
            </div>
          </div>
        )}
        <Keyboard onKey={handleKeyPress} />
      </div>

      {showUpgradeMenu && (
        <UpgradeMenu 
          towers={gameState.towers}
          coins={gameState.coins}
          onUpgrade={upgradeTower}
          onClose={() => setShowUpgradeMenu(false)}
        />
      )}

      {showGrimoire && (
        <Grimoire 
          words={Object.values(gameState.grimoire)}
          onClose={() => setShowGrimoire(false)}
          onClaimReward={claimGrimoireReward}
        />
      )}
    </div>
  );
};

export default App;
