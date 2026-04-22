import { GameState } from './GameState';
import { Building, BuildingType, ResourceType, IPort } from '../entities/Building';
import { Conveyor, ConveyorDirection } from '../entities/Conveyor';
import { getBuildingConfig } from './techTree';

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

  // Reconstruct proper Building instances from saved data + techTree config
  state.buildings = [];
  for (const saved of data.buildings) {
    const cfg = getBuildingConfig(saved.type as BuildingType);
    if (!cfg) continue;

    const inputPorts: IPort[] = cfg.inputs.map(i => ({
      resource: i.resource as ResourceType,
      ratePerTick: i.rate,
      actualRate: 0,
    }));
    const outputPorts: IPort[] = cfg.outputs.map(o => ({
      resource: o.resource as ResourceType,
      ratePerTick: o.rate,
      actualRate: 0,
    }));

    state.buildings.push(new Building({
      id: saved.id,
      type: saved.type as BuildingType,
      x: saved.x,
      y: saved.y,
      width: cfg.width,
      height: cfg.height,
      energyCost: cfg.energyCost,
      vramCost: cfg.vramCost,
      heatPerTick: cfg.heatPerTick,
      inputPorts,
      outputPorts,
      recipeId: saved.recipeId,
    }));
  }

  // Reconstruct proper Conveyor instances from saved data
  state.conveyors = data.conveyors.map(
    c => new Conveyor(c.x, c.y, c.direction as ConveyorDirection, c.mk as 1 | 2 | 3)
  );
}

/** Autosave every 5 minutes (3000 ticks at 10 TPS) */
export function maybeAutosave(state: GameState): void {
  if (state.ticks % 3000 === 0 && state.ticks > 0) {
    saveGame(state);
  }
}
