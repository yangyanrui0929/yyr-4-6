import type {
  Ingredient,
  Recipe,
  TowerConfig,
  EnemyConfig,
  WaveConfig,
  FlavorType,
  ReactionConfig,
  ReactionType,
} from "@/types/game";

export const GRID_COLS = 15;
export const GRID_ROWS = 10;
export const CELL_SIZE = 48;
export const CANVAS_WIDTH = GRID_COLS * CELL_SIZE;
export const CANVAS_HEIGHT = GRID_ROWS * CELL_SIZE;

export const GRID_PATH = [
  { x: 0, y: 5 },
  { x: 3, y: 5 },
  { x: 3, y: 2 },
  { x: 7, y: 2 },
  { x: 7, y: 7 },
  { x: 11, y: 7 },
  { x: 11, y: 4 },
  { x: 14, y: 4 },
];

export const PIXEL_PATH = GRID_PATH.map((p) => ({
  x: p.x * CELL_SIZE + CELL_SIZE / 2,
  y: p.y * CELL_SIZE + CELL_SIZE / 2,
}));

export const FLAVOR_INFO: Record<FlavorType, { name: string; emoji: string; color: string }> = {
  sour: { name: "酸", emoji: "🍋", color: "#FFEB3B" },
  spicy: { name: "辣", emoji: "🌶️", color: "#F44336" },
  umami: { name: "鲜", emoji: "🍄", color: "#8D6E63" },
  cold: { name: "冷", emoji: "🧊", color: "#4FC3F7" },
  burnt: { name: "焦", emoji: "🔥", color: "#FF5722" },
};

export const REACTION_CONFIGS: Record<ReactionType, ReactionConfig> = {
  sour_spicy: {
    id: "sour_spicy",
    name: "酸辣反应",
    emoji: "😵",
    description: "敌人混乱折返，向回走3秒",
    color: "#FF9800",
    flavors: ["sour", "spicy"],
  },
  cold_umami: {
    id: "cold_umami",
    name: "冷鲜反应",
    emoji: "💎",
    description: "击杀奖励翻倍",
    color: "#00BCD4",
    flavors: ["cold", "umami"],
  },
  burnt_spicy: {
    id: "burnt_spicy",
    name: "焦辣反应",
    emoji: "🔥",
    description: "持续灼烧，每秒造成伤害",
    color: "#FF5722",
    flavors: ["burnt", "spicy"],
  },
  sour_umami: {
    id: "sour_umami",
    name: "酸鲜反应",
    emoji: "💧",
    description: "敌人防御降低，受到伤害增加50%",
    color: "#CDDC39",
    flavors: ["sour", "umami"],
  },
  cold_spicy: {
    id: "cold_spicy",
    name: "冷辣反应",
    emoji: "❄️",
    description: "敌人冰冻1.5秒无法移动",
    color: "#2196F3",
    flavors: ["cold", "spicy"],
  },
  burnt_sour: {
    id: "burnt_sour",
    name: "焦酸反应",
    emoji: "💥",
    description: "爆炸伤害，对周围敌人造成溅射",
    color: "#9C27B0",
    flavors: ["burnt", "sour"],
  },
};

export const FLAVOR_HIT_DURATION = 4000;

export const INITIAL_INGREDIENTS: Ingredient[] = [
  { id: "cabbage", name: "白菜", emoji: "🥬", price: 8, count: 0 },
  { id: "potato", name: "土豆", emoji: "🥔", price: 6, count: 0 },
  { id: "tomato", name: "番茄", emoji: "🍅", price: 10, count: 0 },
  { id: "meat", name: "猪肉", emoji: "🥩", price: 20, count: 0 },
  { id: "egg", name: "鸡蛋", emoji: "🥚", price: 5, count: 0 },
  { id: "chili", name: "辣椒", emoji: "🌶️", price: 7, count: 0 },
];

export const INITIAL_RECIPES: Recipe[] = [
  {
    id: "stir_fry_cabbage",
    name: "醋溜白菜",
    emoji: "🥗",
    ingredients: [
      { ingredientId: "cabbage", count: 2 },
      { ingredientId: "chili", count: 1 },
    ],
    sellPrice: 35,
    maxPrepare: 10,
    prepared: 0,
    flavors: ["sour", "spicy"],
  },
  {
    id: "potato_shreds",
    name: "酸辣土豆丝",
    emoji: "🍟",
    ingredients: [
      { ingredientId: "potato", count: 2 },
      { ingredientId: "chili", count: 1 },
    ],
    sellPrice: 30,
    maxPrepare: 10,
    prepared: 0,
    flavors: ["sour", "spicy"],
  },
  {
    id: "tomato_egg",
    name: "番茄炒蛋",
    emoji: "🍳",
    ingredients: [
      { ingredientId: "tomato", count: 2 },
      { ingredientId: "egg", count: 2 },
    ],
    sellPrice: 40,
    maxPrepare: 10,
    prepared: 0,
    flavors: ["umami", "sour"],
  },
  {
    id: "braised_pork",
    name: "红烧肉",
    emoji: "🍖",
    ingredients: [
      { ingredientId: "meat", count: 3 },
      { ingredientId: "potato", count: 1 },
    ],
    sellPrice: 90,
    maxPrepare: 5,
    prepared: 0,
    flavors: ["umami", "burnt"],
  },
  {
    id: "mapo_tofu",
    name: "麻婆豆腐",
    emoji: "🥘",
    ingredients: [
      { ingredientId: "meat", count: 1 },
      { ingredientId: "chili", count: 2 },
    ],
    sellPrice: 55,
    maxPrepare: 8,
    prepared: 0,
    flavors: ["spicy", "umami"],
  },
  {
    id: "ice_cucumber",
    name: "冰镇黄瓜",
    emoji: "🥒",
    ingredients: [
      { ingredientId: "cabbage", count: 1 },
    ],
    sellPrice: 25,
    maxPrepare: 8,
    prepared: 0,
    flavors: ["cold", "sour"],
  },
];

export const TOWER_CONFIGS: Record<string, TowerConfig> = {
  spatula: {
    type: "spatula",
    name: "锅铲塔",
    emoji: "🍳",
    cost: 50,
    damage: 15,
    range: 120,
    fireRate: 800,
    special: "平衡型单体攻击",
    upgradeCost: 40,
    upgradeMultiplier: 1.4,
    flavors: ["umami"],
  },
  chili: {
    type: "chili",
    name: "辣椒塔",
    emoji: "🌶️",
    cost: 80,
    damage: 10,
    range: 100,
    fireRate: 1200,
    special: "范围溅射伤害",
    upgradeCost: 60,
    upgradeMultiplier: 1.5,
    flavors: ["spicy"],
  },
  freezer: {
    type: "freezer",
    name: "冰柜塔",
    emoji: "🧊",
    cost: 70,
    damage: 5,
    range: 110,
    fireRate: 1000,
    special: "减速敌人 50%",
    upgradeCost: 50,
    upgradeMultiplier: 1.3,
    flavors: ["cold"],
  },
  vinegar: {
    type: "vinegar",
    name: "醋瓶塔",
    emoji: "🍶",
    cost: 60,
    damage: 8,
    range: 115,
    fireRate: 900,
    special: "降低敌人防御",
    upgradeCost: 45,
    upgradeMultiplier: 1.4,
    flavors: ["sour"],
  },
  wok: {
    type: "wok",
    name: "炒锅塔",
    emoji: "🍲",
    cost: 90,
    damage: 20,
    range: 90,
    fireRate: 1400,
    special: "高伤害焦香攻击",
    upgradeCost: 70,
    upgradeMultiplier: 1.5,
    flavors: ["burnt"],
  },
};

export const ENEMY_CONFIGS: Record<string, EnemyConfig> = {
  cabbage: {
    type: "cabbage",
    name: "白菜怪",
    emoji: "🥬",
    hp: 40,
    speed: 0.6,
    reward: 8,
    damage: 1,
  },
  potato: {
    type: "potato",
    name: "土豆怪",
    emoji: "🥔",
    hp: 70,
    speed: 0.4,
    reward: 12,
    damage: 1,
  },
  tomato: {
    type: "tomato",
    name: "番茄怪",
    emoji: "🍅",
    hp: 50,
    speed: 0.8,
    reward: 10,
    damage: 1,
  },
  meat: {
    type: "meat",
    name: "肉块怪",
    emoji: "🥩",
    hp: 120,
    speed: 0.35,
    reward: 20,
    damage: 2,
  },
  boss: {
    type: "boss",
    name: "BOSS大魔王",
    emoji: "👹",
    hp: 500,
    speed: 0.25,
    reward: 100,
    damage: 5,
  },
};

export function generateWaves(day: number): WaveConfig[] {
  const difficulty = 1 + (day - 1) * 0.25;
  const waves: WaveConfig[] = [];
  const waveCount = 3 + Math.min(day, 4);

  for (let i = 0; i < waveCount; i++) {
    const wave: WaveConfig = { enemies: [] };

    wave.enemies.push({
      type: "cabbage",
      count: Math.floor((3 + i * 2) * difficulty),
      delay: 900,
    });

    if (i >= 1) {
      wave.enemies.push({
        type: "potato",
        count: Math.floor((2 + i) * difficulty),
        delay: 1100,
      });
    }

    if (i >= 2) {
      wave.enemies.push({
        type: "tomato",
        count: Math.floor((2 + i) * difficulty),
        delay: 700,
      });
    }

    if (i >= 3) {
      wave.enemies.push({
        type: "meat",
        count: Math.floor((1 + Math.floor(i / 2)) * difficulty),
        delay: 1500,
      });
    }

    if (i === waveCount - 1 && day >= 2) {
      wave.enemies.push({
        type: "boss",
        count: 1,
        delay: 2000,
      });
    }

    waves.push(wave);
  }

  return waves;
}

export const INITIAL_GOLD = 200;
export const INITIAL_LIVES = 10;
