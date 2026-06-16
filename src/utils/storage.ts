import type { GameState } from "@/types/game";

const STORAGE_KEY = "kitchen_tower_defense_save";

export function saveGame(state: GameState): void {
  try {
    const data = {
      day: state.day,
      gold: state.gold,
      lives: state.lives,
      ingredients: state.ingredients,
      recipes: state.recipes,
      phase: state.phase,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("保存游戏失败:", e);
  }
}

export function loadGame(): Partial<GameState> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<GameState>;
  } catch (e) {
    console.error("读取存档失败:", e);
    return null;
  }
}

export function clearSave(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function hasSave(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}
