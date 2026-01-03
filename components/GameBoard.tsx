
import React from 'react';
import { Point, EnemyData, BossData, TowerData, TowerType, DefeatedEffect, MissedEffect } from '../types';
import { GRID_SIZE, PATH } from '../constants';

interface GameBoardProps {
  towers: TowerData[];
  enemies: EnemyData[];
  boss: BossData | null;
  defeatedEffects: DefeatedEffect[];
  missedEffects: MissedEffect[];
  getPathPos: (progress: number) => Point;
  selectedSlot: Point | null;
  onSlotClick: (p: Point) => void;
}

const GameBoard: React.FC<GameBoardProps> = ({ 
  towers, 
  enemies, 
  boss,
  defeatedEffects,
  missedEffects,
  getPathPos, 
  selectedSlot, 
  onSlotClick 
}) => {
  const cellSize = 100 / GRID_SIZE;

  const cells = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const isPath = PATH.some((p, i) => {
        if (i === 0) return false;
        const p1 = PATH[i-1];
        const p2 = p;
        if (p1.x === p2.x && x === p1.x) {
          return y >= Math.min(p1.y, p2.y) && y <= Math.max(p1.y, p2.y);
        }
        if (p1.y === p2.y && y === p1.y) {
          return x >= Math.min(p1.x, p2.x) && x <= Math.max(p1.x, p2.x);
        }
        return false;
      });

      const hasTower = towers.some(t => t.gridPos.x === x && t.gridPos.y === y);
      const isSelected = selectedSlot?.x === x && selectedSlot?.y === y;

      cells.push(
        <div
          key={`${x}-${y}`}
          onClick={() => !isPath && !hasTower && onSlotClick({ x, y })}
          className={`absolute border-[0.5px] border-slate-700/20 cursor-pointer transition-all
            ${isPath ? 'bg-indigo-950/40 backdrop-blur-sm' : 'hover:bg-pink-500/10'}
            ${isSelected ? 'ring-2 ring-pink-400 bg-pink-500/30 z-10' : ''}
          `}
          style={{
            left: `${x * cellSize}%`,
            top: `${y * cellSize}%`,
            width: `${cellSize}%`,
            height: `${cellSize}%`
          }}
        />
      );
    }
  }

  const celebrationIcons = ['✨', '🌸', '💫', '💖', '👑', '🔥'];
  const castlePos = PATH[PATH.length - 1];

  return (
    <div className="relative w-full h-full bg-[#0c0a1f]">
      {cells}

      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
        <path
          d={`M ${PATH.map(p => `${(p.x + 0.5) * cellSize}% ${(p.y + 0.5) * cellSize}%`).join(' L ')}`}
          fill="none"
          stroke="#818cf8"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-pulse"
        />
      </svg>

      {/* Spawn Point */}
      <div 
        className="absolute flex items-center justify-center pointer-events-none z-20"
        style={{ 
          left: `${(PATH[0].x + 0.5) * cellSize}%`, 
          top: `${(PATH[0].y + 0.5) * cellSize}%`,
          transform: 'translate(-50%, -50%)'
        }}
      >
        <div className="w-10 h-10 rounded-full bg-pink-600/80 border-2 border-pink-400 flex items-center justify-center shadow-[0_0_30px_rgba(236,72,153,0.8)]">
           <div className="w-4 h-4 rounded-full bg-white animate-ping" />
           <span className="absolute -top-6 text-[10px] font-black text-pink-300 tracking-tighter bungee">SPAWN</span>
        </div>
      </div>

      {/* Castle / Base */}
      <div 
        className="absolute flex items-center justify-center pointer-events-none z-20"
        style={{ 
          left: `${(castlePos.x + 0.5) * cellSize}%`, 
          top: `${(castlePos.y + 0.5) * cellSize}%`,
          transform: 'translate(-50%, -50%)'
        }}
      >
        <div className="flex flex-col items-center group">
            <img 
              src="https://i.ibb.co/d0H1w8X5/Generated-Image-December-31-2025-1-17-AM-removebg-preview.png" 
              alt="Tamar's Castle" 
              className="w-56 h-56 sm:w-80 sm:h-80 drop-shadow-[0_0_40px_rgba(255,255,255,0.5)] object-contain"
            />
            <div className="bg-pink-500 text-white text-[12px] sm:text-[14px] font-black px-4 py-1.5 rounded-full -mt-10 border-2 border-white/20 shadow-2xl relative z-10 bungee tracking-widest">
              HOME
            </div>
        </div>
      </div>

      {/* BOSS RENDERER */}
      {boss && (
        <>
          {/* Boss HP Bar - Hidden during death */}
          {!boss.isDying && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-3/4 z-[60] animate-in fade-in slide-in-from-top-4 duration-700">
               <div className="flex justify-between items-end mb-1">
                  <span className="text-pink-400 bungee text-xs tracking-widest shadow-text">VOID COLOSSUS</span>
                  <span className="text-white bungee text-[10px]">{Math.ceil(boss.hp)} / {boss.maxHp}</span>
               </div>
               <div className="h-4 bg-slate-900 rounded-full border-2 border-pink-600/50 p-0.5 overflow-hidden shadow-2xl">
                  <div 
                    className="h-full bg-gradient-to-r from-red-600 via-pink-500 to-red-600 transition-all duration-300 relative"
                    style={{ width: `${(boss.hp / boss.maxHp) * 100}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                  </div>
               </div>
            </div>
          )}

          {/* Boss Sprite */}
          <div
            className={`absolute z-40 transition-all duration-75 ${boss.isDying ? 'animate-boss-death' : ''}`}
            style={{
              left: `${(getPathPos(boss.progress).x + 0.5) * cellSize}%`,
              top: `${(getPathPos(boss.progress).y + 0.5) * cellSize}%`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div className="relative group">
               <img 
                 src="https://i.ibb.co/gZvyxQ1W/Generated-Image-December-31-2025-2-32-AM-removebg-preview.png" 
                 alt="Boss Monster"
                 className={`w-32 h-32 sm:w-48 sm:h-48 object-contain drop-shadow-[0_0_20px_rgba(255,0,0,0.4)] ${!boss.isDying ? 'animate-pulse' : ''}`}
               />
               {!boss.isDying && (
                 <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/80 px-2 py-0.5 rounded text-[8px] font-black text-red-500 border border-red-500/50 uppercase tracking-tighter">
                   Level 99 Entity
                 </div>
               )}
            </div>
          </div>
        </>
      )}

      {/* Enemy words */}
      {enemies.map(enemy => {
        const pos = getPathPos(enemy.progress);
        return (
          <div
            key={enemy.id}
            className="absolute z-30 flex flex-col items-center transition-all duration-75"
            style={{
              left: `${(pos.x + 0.5) * cellSize}%`,
              top: `${(pos.y + 0.5) * cellSize}%`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div className="bg-white/10 backdrop-blur-md border border-indigo-400/50 px-2 py-1 rounded-lg text-xs font-bold tracking-widest whitespace-nowrap shadow-[0_5px_15px_rgba(0,0,0,0.5)] anime-border">
              {enemy.displayWord.split('').map((char, i) => (
                <span key={i} className={char === '_' ? 'text-pink-400 animate-pulse font-black' : 'text-indigo-100'}>
                  {char}
                </span>
              ))}
            </div>
          </div>
        );
      })}

      {/* SUCCESS POPUPS */}
      {defeatedEffects.map(effect => (
        <React.Fragment key={effect.id}>
          {/* Location Effect */}
          <div
            className="absolute z-40 pointer-events-none"
            style={{
              left: `${(effect.pos.x + 0.5) * cellSize}%`,
              top: `${(effect.pos.y + 0.5) * cellSize}%`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div className={`relative animate-chibi flex flex-col items-center ${effect.isBoss ? 'scale-150' : ''}`}>
              <div className="text-4xl mb-2 drop-shadow-glow">
                  {effect.isBoss ? '🏆' : ['٩(◕‿◕)۶', '⸜(｡˃ ᵕ ˂ )⸝', '(*≧ω≦*)', '(๑˃ᴗ˂)'][Math.floor(Math.random() * 4)]}
              </div>
              <div className={`text-pink-300 font-black bungee outline-text-indigo ${effect.isBoss ? 'text-xl' : 'text-sm'}`}>
                +{effect.coins}¢
              </div>
              {celebrationIcons.map((icon, i) => (
                <div key={i} className="absolute sparkle-node text-lg" style={{ 
                  top: `${Math.sin(i) * (effect.isBoss ? 60 : 30)}px`, 
                  left: `${Math.cos(i) * (effect.isBoss ? 60 : 30)}px`,
                  animationDelay: `${i * 0.2}s`
                }}>{icon}</div>
              ))}
            </div>
          </div>

          {/* Victory / Clear Banner */}
          <div
            className="absolute z-50 pointer-events-none w-full h-full flex items-center justify-center"
            style={{ left: 0, top: 0 }}
          >
            {effect.isBoss ? (
              <div className="animate-victory-banner bg-slate-900/80 backdrop-blur-xl w-full py-8 border-y-4 border-amber-500 shadow-[0_0_100px_rgba(245,158,11,0.5)] flex flex-col items-center">
                 <div className="text-[10px] text-amber-400 bungee tracking-[0.8em] mb-2">ANNIHILATED</div>
                 <h1 className="text-5xl sm:text-7xl bungee gold-text drop-shadow-[0_0_30px_rgba(255,215,0,0.5)]">BOSS DEFEATED</h1>
                 <div className="flex gap-4 mt-4">
                    {celebrationIcons.map((icon, i) => (
                      <span key={i} className="text-3xl animate-bounce" style={{ animationDelay: `${i * 0.1}s` }}>{icon}</span>
                    ))}
                 </div>
              </div>
            ) : (
              <div className="absolute top-1/4 animate-float-up flex flex-col items-center">
                <div className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2 rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.5)] border-2 border-white/40">
                  <span className="text-sm font-black bungee tracking-tight">HIT!</span>
                  <span className="w-px h-4 bg-white/30" />
                  <span className="text-[14px] font-black tracking-[0.2em] uppercase text-emerald-50">{effect.word}</span>
                  <span className="text-lg">⚔️</span>
                </div>
              </div>
            )}
          </div>
        </React.Fragment>
      ))}

      {/* BREACH POPUPS */}
      {missedEffects.map(effect => (
        <div
          key={effect.id}
          className="absolute z-50 pointer-events-none w-full flex justify-center"
          style={{
            left: `0`,
            right: `0`,
            top: `${(castlePos.y + 0.5) * cellSize}%`,
            transform: 'translateY(-100%)'
          }}
        >
          <div className="animate-float-up flex flex-col items-center">
            <div className="flex items-center gap-1.5 bg-pink-600 text-white px-4 py-1.5 rounded-2xl shadow-2xl border-2 border-white/30 anime-border">
               <span className="text-sm font-black bungee">KO! -5 HP</span>
               <span className="w-px h-4 bg-white/30" />
               <span className="text-[12px] font-bold tracking-wider uppercase text-pink-100">{effect.word}</span>
            </div>
          </div>
        </div>
      ))}

      {towers.map(tower => (
        <div
          key={tower.id}
          className={`absolute z-20 flex items-center justify-center rounded-2xl shadow-xl transition-all hover:scale-110 border-2
            ${tower.type === TowerType.SLOW ? 'bg-indigo-600 border-indigo-400' : 'bg-pink-600 border-pink-400'}
          `}
          style={{
            left: `${tower.gridPos.x * cellSize + cellSize * 0.1}%`,
            top: `${tower.gridPos.y * cellSize + cellSize * 0.1}%`,
            width: `${cellSize * 0.8}%`,
            height: `${cellSize * 0.8}%`
          }}
        >
          <div className="flex flex-col items-center text-white leading-none relative">
            <span className="text-2xl drop-shadow-glow">{tower.type === TowerType.SLOW ? '🌀' : '⚡'}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default GameBoard;
