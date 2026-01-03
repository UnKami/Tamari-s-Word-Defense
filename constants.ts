
import { TowerType, TowerStats, Point } from './types';

export const GRID_SIZE = 12;
export const INITIAL_HEALTH = 10;
export const INITIAL_COINS = 250;

// Simple path points (Zig-Zag)
// Adjusted final X to 10.2 to prevent the castle from overflowing the right edge
export const PATH: Point[] = [
  { x: 0, y: 1 },
  { x: 4, y: 1 },
  { x: 4, y: 5 },
  { x: 8, y: 5 },
  { x: 8, y: 10 },
  { x: 10.2, y: 10 }
];

export const TOWER_STATS: Record<TowerType, TowerStats> = {
  [TowerType.SLOW]: {
    cost: 100,
    upgradeCost: (lvl) => 50 + lvl * 75,
    effectValue: (lvl) => 0.5 - (lvl * 0.05), // Speed multiplier (lower is slower)
    range: 1.8
  },
  [TowerType.AUTOFILL]: {
    cost: 1000,
    upgradeCost: (lvl) => 100 + lvl * 100,
    effectValue: (lvl) => Math.max(2, 10 - lvl), // Cooldown in seconds
    range: 2.5
  }
};

export const WORD_LIST = [
  "APPLE", "BANANA", "CHERRY", "DRAGON", "ENERGY", "FUTURE", "GALAXY", "HEAVEN",
  "ISLAND", "JUNGLE", "KITTEN", "LIZARD", "MONKEY", "NATURE", "OCEAN", "PLANET",
  "QUARTZ", "RIVER", "STREET", "TIGER", "URBAN", "VALLEY", "WINTER", "XYLEM",
  "YELLOW", "ZEBRA", "BRAVE", "CRISP", "DREAM", "FLAME", "GHOST", "HEART",
  "LIGHT", "MUSIC", "NIGHT", "PEACE", "QUIET", "SMILE", "TRUTH", "VOICE", "WATER"
];
