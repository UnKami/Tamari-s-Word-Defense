
export type Point = { x: number; y: number };

export enum TowerType {
  SLOW = 'SLOW',
  AUTOFILL = 'AUTOFILL'
}

export interface WordDetail {
  word: string;
  definition: string;
  partOfSpeech: string;
  example: string;
  etymology?: string;
  defeatCount: number;
  rewardClaimed: boolean;
  attackPower: number; // Added: Power rating of the word
}

export interface TowerData {
  id: string;
  type: TowerType;
  gridPos: Point;
  level: number;
  lastActionTime: number; // for cooldowns
  range: number;
}

export interface EnemyData {
  id: string;
  fullWord: string;
  displayWord: string;
  missingIndices: number[];
  progress: number; // 0 to 1
  isSlowed: boolean;
  slowTimer: number;
}

export interface BossData {
  hp: number;
  maxHp: number;
  progress: number;
  targetWord: string;
  typedPart: string;
  isDying?: boolean;
}

export interface DefeatedEffect {
  id: string;
  pos: Point;
  coins: number;
  word: string;
  startTime: number;
  isBoss?: boolean;
}

export interface MissedEffect {
  id: string;
  word: string;
  startTime: number;
}

export interface GameState {
  health: number;
  coins: number;
  wave: number;
  isWaveActive: boolean;
  waveInterval: number;
  enemies: EnemyData[];
  boss: BossData | null;
  towers: TowerData[];
  defeatedEffects: DefeatedEffect[];
  missedEffects: MissedEffect[];
  grimoire: Record<string, WordDetail>;
  isVictorySequenceActive?: boolean;
}

export interface TowerStats {
  cost: number;
  upgradeCost: (level: number) => number;
  effectValue: (level: number) => number; // seconds or factor
  range: number;
}
