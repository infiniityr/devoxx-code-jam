import { GameState } from './GameState';
import { Building } from '../entities/Building';
import { Conveyor } from '../entities/Conveyor';

interface SaveData {
  version: string;
  seed: number;
  ticks: number;
  credits: number;
  researchPoints: number;
  unlockedTech: string[];
  unlockedRecipes: string[];
  vramCapacity: number;
  buildings: Array<{
    id: string;
    type: string;
    x: number;
    y: number;
    recipeId?: string;
  }>;
  conveyors: Array<{
    x: number;
    y: number;
    direction: string;
    mk: number;
  }>;
}

const SAVE_KEY = 'neural_assembly_autosave';

export function saveGame(state: GameState): void {
  const data: SaveData = {
    version: '0.1',
    seed: state.seed,
    ticks: state.ticks,
    credits: state.credits,
    researchPoints: state.researchPoints,
    unlockedTech: [...state.unlockedTech],
    unlockedRecipes: [...state.unlockedRecipes],
    vramCapacity: state.vramCapacity,
    buildings: state.buildings.map(b => ({
      id: b.id,
      type: b.type,
      x: b.x,
      y: b.y,
      recipeId: b.recipeId,
    })),
    conveyors: state.conveyors.map(c => ({
      x: c.x,
      y: c.y,
      direction: c.direction,
      mk: c.mk,
    })),
  };
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Save failed', e);
  }
}

export function loadGame(): SaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SaveData;
  } catch {
    return null;
  }
}

export function applyLoad(state: GameState, data: SaveData): void {
  state.ticks = data.ticks;
  state.credits = data.credits;
  state.researchPoints = data.researchPoints;
  state.unlockedTech = new Set(data.unlockedTech);
  state.unlockedRecipes = new Set(data.unlockedRecipes);
  state.vramCapacity = data.vramCapacity;
  state.seed = data.seed;

  // Buildings and conveyors are re-created by the world module on load
  // (handled in GameScene)
  state.buildings = data.buildings as unknown as Building[];
  state.conveyors = data.conveyors as unknown as Conveyor[];
}

/** Autosave every 5 minutes (3000 ticks at 10 TPS) */
export function maybeAutosave(state: GameState): void {
  if (state.ticks % 3000 === 0 && state.ticks > 0) {
    saveGame(state);
  }
}
