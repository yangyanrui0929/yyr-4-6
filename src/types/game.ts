export type GamePhase = "day" | "night" | "settlement";

export type TowerType = "spatula" | "chili" | "freezer" | "vinegar" | "wok";

export type EnemyType = "cabbage" | "potato" | "tomato" | "meat" | "boss";

export type FlavorType = "sour" | "spicy" | "umami" | "cold" | "burnt";

export type ReactionType =
  | "sour_spicy"
  | "cold_umami"
  | "burnt_spicy"
  | "sour_umami"
  | "cold_spicy"
  | "burnt_sour";

export interface FlavorHit {
  flavor: FlavorType;
  timestamp: number;
}

export interface ReactionConfig {
  id: ReactionType;
  name: string;
  emoji: string;
  description: string;
  color: string;
  flavors: [FlavorType, FlavorType];
}

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
  flavors: FlavorType[];
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
  flavors: FlavorType[];
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
  flavorHits: FlavorHit[];
  burnUntil: number;
  burnDamage: number;
  confusedUntil: number;
  bonusRewardUntil: number;
  bonusRewardMultiplier: number;
  lastReaction: ReactionType | null;
  lastReactionTime: number;
}

export interface Bullet {
  id: string;
  x: number;
  y: number;
  targetId: string;
  damage: number;
  type: TowerType;
  speed: number;
  flavors: FlavorType[];
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
  baseFlavors: FlavorType[];
  reactionCounts: Record<ReactionType, number>;
}
