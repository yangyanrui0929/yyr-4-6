export type GamePhase = "day" | "night" | "settlement";

export type TowerType = "spatula" | "chili" | "freezer";

export type EnemyType = "cabbage" | "potato" | "tomato" | "meat" | "boss";

export interface Ingredient {
  id: string;
  name: string;
  emoji: string;
  price: number;
  count: number;
}

export interface Recipe {
  id: string;
  name: string;
  emoji: string;
  ingredients: { ingredientId: string; count: number }[];
  sellPrice: number;
  maxPrepare: number;
  prepared: number;
}

export interface TowerConfig {
  type: TowerType;
  name: string;
  emoji: string;
  cost: number;
  damage: number;
  range: number;
  fireRate: number;
  special?: string;
  upgradeCost: number;
  upgradeMultiplier: number;
}

export interface Tower {
  id: string;
  type: TowerType;
  gridX: number;
  gridY: number;
  level: number;
  lastFireTime: number;
}

export interface EnemyConfig {
  type: EnemyType;
  name: string;
  emoji: string;
  hp: number;
  speed: number;
  reward: number;
  damage: number;
}

export interface Enemy {
  id: string;
  type: EnemyType;
  hp: number;
  maxHp: number;
  x: number;
  y: number;
  pathIndex: number;
  slowUntil: number;
  slowFactor: number;
  hitFlash: number;
}

export interface Bullet {
  id: string;
  x: number;
  y: number;
  targetId: string;
  damage: number;
  type: TowerType;
  speed: number;
}

export interface WaveConfig {
  enemies: { type: EnemyType; count: number; delay: number }[];
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  createdAt: number;
}

export interface GameState {
  day: number;
  phase: GamePhase;
  gold: number;
  lives: number;
  ingredients: Ingredient[];
  recipes: Recipe[];
  towers: Tower[];
  enemies: Enemy[];
  bullets: Bullet[];
  floatingTexts: FloatingText[];
  currentWave: number;
  totalWaves: number;
  waveInProgress: boolean;
  todayRevenue: number;
  todayExpense: number;
  waveReward: number;
  selectedTowerType: TowerType | null;
  selectedTowerId: string | null;
  path: { x: number; y: number }[];
  gridPath: { x: number; y: number }[];
  isPaused: boolean;
  gameOver: boolean;
}
