import { create } from "zustand";
import type {
  GameState,
  TowerType,
  Enemy,
  Bullet,
  FloatingText,
  FlavorType,
  ReactionType,
} from "@/types/game";
import {
  INITIAL_GOLD,
  INITIAL_LIVES,
  INITIAL_INGREDIENTS,
  INITIAL_RECIPES,
  PIXEL_PATH,
  GRID_PATH,
  TOWER_CONFIGS,
  ENEMY_CONFIGS,
  CELL_SIZE,
  generateWaves,
  REACTION_CONFIGS,
} from "@/game/config";
import { loadGame, saveGame } from "@/utils/storage";

let idCounter = 0;
const genId = () => `${Date.now()}-${idCounter++}`;

function calculateBaseFlavors(recipes: { prepared: number; flavors: FlavorType[] }[]): FlavorType[] {
  const flavorCounts: Record<string, number> = {};
  for (const recipe of recipes) {
    if (recipe.prepared > 0) {
      for (const flavor of recipe.flavors) {
        flavorCounts[flavor] = (flavorCounts[flavor] || 0) + recipe.prepared;
      }
    }
  }
  const sorted = Object.entries(flavorCounts).sort((a, b) => b[1] - a[1]);
  return sorted.slice(0, 3).map(([flavor]) => flavor as FlavorType);
}

function initialReactionCounts(): Record<ReactionType, number> {
  const counts = {} as Record<ReactionType, number>;
  for (const key of Object.keys(REACTION_CONFIGS) as ReactionType[]) {
    counts[key] = 0;
  }
  return counts;
}

interface GameActions {
  resetGame: () => void;
  loadFromSave: () => boolean;
  saveProgress: () => void;

  buyIngredient: (ingredientId: string, amount: number) => boolean;
  cookRecipe: (recipeId: string, amount: number) => boolean;
  cookMax: (recipeId: string) => number;

  startNight: () => void;
  startDay: () => void;

  selectTowerType: (type: TowerType | null) => void;
  selectTower: (towerId: string | null) => void;
  placeTower: (gridX: number, gridY: number) => boolean;
  upgradeTower: (towerId: string) => boolean;
  sellTower: (towerId: string) => void;

  startWave: () => void;
  togglePause: () => void;

  addEnemy: (enemy: Omit<Enemy, "id">) => void;
  updateEnemy: (id: string, updates: Partial<Enemy>) => void;
  removeEnemy: (id: string) => void;
  addBullet: (bullet: Omit<Bullet, "id">) => void;
  removeBullet: (id: string) => void;
  addFloatingText: (text: Omit<FloatingText, "id" | "createdAt">) => void;
  removeFloatingText: (id: string) => void;

  addGold: (amount: number) => void;
  addWaveReward: (amount: number) => void;
  loseLife: (amount: number) => void;
  setWaveInProgress: (inProgress: boolean) => void;
  nextWave: () => void;
  finishAllWaves: () => void;
  setGameOver: () => void;
  getCurrentWaves: () => ReturnType<typeof generateWaves>;
  incrementReactionCount: (reaction: ReactionType) => void;
  calculateBaseFlavorsFromMenu: () => void;
}

const createInitialState = (): GameState => {
  const saved = loadGame();
  if (saved) {
    const recipes = saved.recipes ?? INITIAL_RECIPES.map((r) => ({ ...r }));
    return {
      day: saved.day ?? 1,
      phase: saved.phase ?? "day",
      gold: saved.gold ?? INITIAL_GOLD,
      lives: saved.lives ?? INITIAL_LIVES,
      ingredients: saved.ingredients ?? INITIAL_INGREDIENTS.map((i) => ({ ...i })),
      recipes,
      towers: [],
      enemies: [],
      bullets: [],
      floatingTexts: [],
      currentWave: 0,
      totalWaves: 0,
      waveInProgress: false,
      todayRevenue: 0,
      todayExpense: 0,
      waveReward: 0,
      selectedTowerType: null,
      selectedTowerId: null,
      path: PIXEL_PATH,
      gridPath: GRID_PATH,
      isPaused: false,
      gameOver: false,
      baseFlavors: calculateBaseFlavors(recipes),
      reactionCounts: initialReactionCounts(),
    };
  }

  return {
    day: 1,
    phase: "day",
    gold: INITIAL_GOLD,
    lives: INITIAL_LIVES,
    ingredients: INITIAL_INGREDIENTS.map((i) => ({ ...i })),
    recipes: INITIAL_RECIPES.map((r) => ({ ...r })),
    towers: [],
    enemies: [],
    bullets: [],
    floatingTexts: [],
    currentWave: 0,
    totalWaves: 0,
    waveInProgress: false,
    todayRevenue: 0,
    todayExpense: 0,
    waveReward: 0,
    selectedTowerType: null,
    selectedTowerId: null,
    path: PIXEL_PATH,
    gridPath: GRID_PATH,
    isPaused: false,
    gameOver: false,
    baseFlavors: [],
    reactionCounts: initialReactionCounts(),
  };
};

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  ...createInitialState(),

  resetGame: () => {
    localStorage.removeItem("kitchen_tower_defense_save");
    idCounter = 0;
    set({
      day: 1,
      phase: "day",
      gold: INITIAL_GOLD,
      lives: INITIAL_LIVES,
      ingredients: INITIAL_INGREDIENTS.map((i) => ({ ...i })),
      recipes: INITIAL_RECIPES.map((r) => ({ ...r, prepared: 0 })),
      towers: [],
      enemies: [],
      bullets: [],
      floatingTexts: [],
      currentWave: 0,
      totalWaves: 0,
      waveInProgress: false,
      todayRevenue: 0,
      todayExpense: 0,
      waveReward: 0,
      selectedTowerType: null,
      selectedTowerId: null,
      isPaused: false,
      gameOver: false,
      baseFlavors: [],
      reactionCounts: initialReactionCounts(),
    });
  },

  loadFromSave: () => {
    const saved = loadGame();
    if (!saved) return false;
    set({
      day: saved.day ?? 1,
      phase: saved.phase ?? "day",
      gold: saved.gold ?? INITIAL_GOLD,
      lives: saved.lives ?? INITIAL_LIVES,
      ingredients: saved.ingredients ?? INITIAL_INGREDIENTS.map((i) => ({ ...i })),
      recipes: saved.recipes ?? INITIAL_RECIPES.map((r) => ({ ...r })),
    });
    return true;
  },

  saveProgress: () => {
    saveGame(get());
  },

  buyIngredient: (ingredientId: string, amount: number) => {
    const state = get();
    const ingredient = state.ingredients.find((i) => i.id === ingredientId);
    if (!ingredient) return false;
    const totalCost = ingredient.price * amount;
    if (state.gold < totalCost) return false;

    set((s) => ({
      gold: s.gold - totalCost,
      todayExpense: s.todayExpense + totalCost,
      ingredients: s.ingredients.map((i) =>
        i.id === ingredientId ? { ...i, count: i.count + amount } : i
      ),
    }));
    return true;
  },

  cookRecipe: (recipeId: string, amount: number) => {
    const state = get();
    const recipe = state.recipes.find((r) => r.id === recipeId);
    if (!recipe) return false;
    if (recipe.prepared + amount > recipe.maxPrepare) return false;

    for (const req of recipe.ingredients) {
      const ing = state.ingredients.find((i) => i.id === req.ingredientId);
      if (!ing || ing.count < req.count * amount) return false;
    }

    set((s) => {
      const newIngredients = s.ingredients.map((i) => {
        const req = recipe.ingredients.find((r) => r.ingredientId === i.id);
        if (req) {
          return { ...i, count: i.count - req.count * amount };
        }
        return i;
      });
      const newRecipes = s.recipes.map((r) =>
        r.id === recipeId ? { ...r, prepared: r.prepared + amount } : r
      );
      return { ingredients: newIngredients, recipes: newRecipes };
    });
    return true;
  },

  cookMax: (recipeId: string) => {
    const state = get();
    const recipe = state.recipes.find((r) => r.id === recipeId);
    if (!recipe) return 0;

    let maxByPrepared = recipe.maxPrepare - recipe.prepared;
    if (maxByPrepared <= 0) return 0;

    let maxByIngredients = Infinity;
    for (const req of recipe.ingredients) {
      const ing = state.ingredients.find((i) => i.id === req.ingredientId);
      if (!ing) return 0;
      const canMake = Math.floor(ing.count / req.count);
      if (canMake < maxByIngredients) maxByIngredients = canMake;
    }

    const amount = Math.min(maxByPrepared, maxByIngredients);
    if (amount <= 0) return 0;

    set((s) => {
      const newIngredients = s.ingredients.map((i) => {
        const req = recipe.ingredients.find((r) => r.ingredientId === i.id);
        if (req) {
          return { ...i, count: i.count - req.count * amount };
        }
        return i;
      });
      const newRecipes = s.recipes.map((r) =>
        r.id === recipeId ? { ...r, prepared: r.prepared + amount } : r
      );
      return { ingredients: newIngredients, recipes: newRecipes };
    });
    return amount;
  },

  startNight: () => {
    const state = get();
    const waves = generateWaves(state.day);
    const baseFlavors = calculateBaseFlavors(state.recipes);
    set({
      phase: "night",
      currentWave: 0,
      totalWaves: waves.length,
      waveInProgress: false,
      towers: [],
      enemies: [],
      bullets: [],
      floatingTexts: [],
      waveReward: 0,
      selectedTowerType: null,
      selectedTowerId: null,
      isPaused: false,
      baseFlavors,
      reactionCounts: initialReactionCounts(),
    });
  },

  startDay: () => {
    set((s) => ({
      phase: "day",
      day: s.day + 1,
      todayRevenue: 0,
      todayExpense: 0,
      waveReward: 0,
      recipes: s.recipes.map((r) => ({ ...r, prepared: 0 })),
      towers: [],
      enemies: [],
      bullets: [],
      floatingTexts: [],
      currentWave: 0,
      totalWaves: 0,
      waveInProgress: false,
      selectedTowerType: null,
      selectedTowerId: null,
      isPaused: false,
      baseFlavors: [],
    }));
    get().saveProgress();
  },

  selectTowerType: (type) => set({ selectedTowerType: type, selectedTowerId: null }),

  selectTower: (towerId) => set({ selectedTowerId: towerId, selectedTowerType: null }),

  placeTower: (gridX: number, gridY: number) => {
    const state = get();
    if (!state.selectedTowerType) return false;
    const config = TOWER_CONFIGS[state.selectedTowerType];
    if (state.gold < config.cost) return false;

    const pathCells = new Set(state.gridPath.map((p) => `${p.x},${p.y}`));
    if (pathCells.has(`${gridX},${gridY}`)) return false;

    const occupied = state.towers.some(
      (t) => t.gridX === gridX && t.gridY === gridY
    );
    if (occupied) return false;

    const pathSegs: Set<string> = new Set();
    for (let i = 0; i < state.gridPath.length - 1; i++) {
      const a = state.gridPath[i];
      const b = state.gridPath[i + 1];
      if (a.x === b.x) {
        const [s2, e] = a.y < b.y ? [a.y, b.y] : [b.y, a.y];
        for (let y = s2; y <= e; y++) pathSegs.add(`${a.x},${y}`);
      } else {
        const [s2, e] = a.x < b.x ? [a.x, b.x] : [b.x, a.x];
        for (let x = s2; x <= e; x++) pathSegs.add(`${x},${a.y}`);
      }
    }
    if (pathSegs.has(`${gridX},${gridY}`)) return false;

    set((s) => ({
      gold: s.gold - config.cost,
      towers: [
        ...s.towers,
        {
          id: genId(),
          type: s.selectedTowerType!,
          gridX,
          gridY,
          level: 1,
          lastFireTime: 0,
        },
      ],
    }));
    return true;
  },

  upgradeTower: (towerId: string) => {
    const state = get();
    const tower = state.towers.find((t) => t.id === towerId);
    if (!tower) return false;
    const config = TOWER_CONFIGS[tower.type];
    const cost = Math.floor(config.upgradeCost * Math.pow(config.upgradeMultiplier, tower.level - 1));
    if (state.gold < cost) return false;
    if (tower.level >= 5) return false;

    set((s) => ({
      gold: s.gold - cost,
      towers: s.towers.map((t) =>
        t.id === towerId ? { ...t, level: t.level + 1 } : t
      ),
    }));
    return true;
  },

  sellTower: (towerId: string) => {
    const state = get();
    const tower = state.towers.find((t) => t.id === towerId);
    if (!tower) return;
    const config = TOWER_CONFIGS[tower.type];
    let totalCost = config.cost;
    for (let l = 1; l < tower.level; l++) {
      totalCost += Math.floor(config.upgradeCost * Math.pow(config.upgradeMultiplier, l - 1));
    }
    const refund = Math.floor(totalCost * 0.6);

    set((s) => ({
      gold: s.gold + refund,
      towers: s.towers.filter((t) => t.id !== towerId),
      selectedTowerId: null,
    }));
  },

  startWave: () => set({ waveInProgress: true }),

  togglePause: () => set((s) => ({ isPaused: !s.isPaused })),

  addEnemy: (enemy) =>
    set((s) => ({
      enemies: [...s.enemies, { ...enemy, id: genId() }],
    })),

  updateEnemy: (id, updates) =>
    set((s) => ({
      enemies: s.enemies.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    })),

  removeEnemy: (id) => {
    const state = get();
    const enemy = state.enemies.find((e) => e.id === id);
    if (enemy) {
      let reward = ENEMY_CONFIGS[enemy.type].reward;
      if (enemy.bonusRewardUntil > Date.now()) {
        reward = Math.floor(reward * enemy.bonusRewardMultiplier);
      }
      set((s) => ({
        gold: s.gold + reward,
        waveReward: s.waveReward + reward,
      }));
    }
    set((s) => ({ enemies: s.enemies.filter((e) => e.id !== id) }));
  },

  addBullet: (bullet) =>
    set((s) => ({
      bullets: [...s.bullets, { ...bullet, id: genId() }],
    })),

  removeBullet: (id) =>
    set((s) => ({ bullets: s.bullets.filter((b) => b.id !== id) })),

  addFloatingText: (text) =>
    set((s) => ({
      floatingTexts: [
        ...s.floatingTexts,
        { ...text, id: genId(), createdAt: Date.now() },
      ],
    })),

  removeFloatingText: (id) =>
    set((s) => ({ floatingTexts: s.floatingTexts.filter((t) => t.id !== id) })),

  addGold: (amount) =>
    set((s) => ({
      gold: s.gold + amount,
      todayRevenue: s.todayRevenue + amount,
    })),

  addWaveReward: (amount) =>
    set((s) => ({
      gold: s.gold + amount,
      waveReward: s.waveReward + amount,
    })),

  loseLife: (amount) =>
    set((s) => {
      const newLives = s.lives - amount;
      return {
        lives: newLives,
        gameOver: newLives <= 0,
      };
    }),

  setWaveInProgress: (inProgress) => set({ waveInProgress: inProgress }),

  nextWave: () =>
    set((s) => ({
      currentWave: s.currentWave + 1,
      waveInProgress: false,
    })),

  finishAllWaves: () => {
    const state = get();
    let foodRevenue = 0;
    for (const r of state.recipes) {
      foodRevenue += r.prepared * r.sellPrice;
    }
    set((s) => ({
      phase: "settlement",
      gold: s.gold + foodRevenue,
      todayRevenue: foodRevenue + s.waveReward,
    }));
    get().saveProgress();
  },

  setGameOver: () => set({ gameOver: true, phase: "settlement" }),

  getCurrentWaves: () => generateWaves(get().day),

  incrementReactionCount: (reaction) =>
    set((s) => ({
      reactionCounts: {
        ...s.reactionCounts,
        [reaction]: s.reactionCounts[reaction] + 1,
      },
    })),

  calculateBaseFlavorsFromMenu: () => {
    const state = get();
    const baseFlavors = calculateBaseFlavors(state.recipes);
    set({ baseFlavors });
  },
}));

export function getTowerStats(tower: { type: TowerType; level: number }) {
  const config = TOWER_CONFIGS[tower.type];
  const mult = Math.pow(config.upgradeMultiplier, tower.level - 1);
  return {
    damage: Math.floor(config.damage * mult),
    range: config.range + (tower.level - 1) * 10,
    fireRate: Math.max(200, config.fireRate - (tower.level - 1) * 80),
    upgradeCost:
      tower.level >= 5
        ? 0
        : Math.floor(
            config.upgradeCost * Math.pow(config.upgradeMultiplier, tower.level - 1)
          ),
  };
}

export function getTowerPixelPos(tower: { gridX: number; gridY: number }) {
  return {
    x: tower.gridX * CELL_SIZE + CELL_SIZE / 2,
    y: tower.gridY * CELL_SIZE + CELL_SIZE / 2,
  };
}
