import { GameState } from './GameState';
import { Building, BuildingType, ResourceType, IPort } from '../entities/Building';
import { Conveyor, ConveyorDirection } from '../entities/Conveyor';
import { Splitter, Merger } from '../entities/Logistics';
import { getBuildingConfig, recomputeTechModifiers } from './techTree';
import demoSaveData from '../data/demoSave.json';

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
  splitters: Array<{
    id: string;
    x: number;
    y: number;
    outputDirections: string[];
    currentOutputIndex: number;
  }>;
  mergers: Array<{
    id: string;
    x: number;
    y: number;
    inputDirections: [string, string];
    outputDirection: string;
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
    splitters: state.splitters.map(s => ({
      id: s.id,
      x: s.x,
      y: s.y,
      outputDirections: s.outputDirections,
      currentOutputIndex: s.currentOutputIndex,
    })),
    mergers: state.mergers.map(m => ({
      id: m.id,
      x: m.x,
      y: m.y,
      inputDirections: m.inputDirections,
      outputDirection: m.outputDirection,
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

  recomputeTechModifiers(state);

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

  // Reconstruct Splitters and Mergers
  state.splitters = (data.splitters ?? []).map(s =>
    new Splitter(s.id, s.x, s.y, s.outputDirections as ConveyorDirection[])
  );
  for (let i = 0; i < state.splitters.length; i++) {
    state.splitters[i].currentOutputIndex = (data.splitters ?? [])[i]?.currentOutputIndex ?? 0;
  }

  state.mergers = (data.mergers ?? []).map(m =>
    new Merger(
      m.id,
      m.x,
      m.y,
      m.inputDirections as [ConveyorDirection, ConveyorDirection],
      m.outputDirection as ConveyorDirection
    )
  );
}

/** Autosave every 5 minutes (3000 ticks at 10 TPS) */
export function maybeAutosave(state: GameState): void {
  if (state.ticks % 3000 === 0 && state.ticks > 0) {
    saveGame(state);
  }
}

/** Return the bundled demo save (loaded when ?demo=true is in the URL) */
export function loadDemoSave(): SaveData {
  return demoSaveData as SaveData;
}
