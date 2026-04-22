import { GameState } from './GameState';
import { Building, BuildingType, ResourceType, IPort } from '../entities/Building';
import { Conveyor, ConveyorDirection } from '../entities/Conveyor';
import { Splitter, Merger } from '../entities/Logistics';
import { getBuildingConfig } from './techTree';
import { EventBus, Events } from '../EventBus';

let _nextId = 1;
function nextId(prefix: string): string {
  return `${prefix}_${_nextId++}`;
}

/** After loading a save, sync _nextId so new buildings don't collide with loaded IDs */
export function syncNextId(buildings: Building[]): void {
  for (const b of buildings) {
    const num = parseInt(b.id.split('_').pop() ?? '0', 10);
    if (num >= _nextId) _nextId = num + 1;
  }
}

export function placeBuilding(
  state: GameState,
  type: BuildingType,
  x: number,
  y: number,
  recipeId?: string
): Building | null {
  const cfg = getBuildingConfig(type);
  if (!cfg) return null;

  if (state.credits < cfg.buildCost) return null;

  // Collision check
  for (const b of state.buildings) {
    if (overlaps(b.x, b.y, b.width, b.height, x, y, cfg.width, cfg.height)) {
      return null;
    }
  }

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

  const building = new Building({
    id: nextId(type),
    type,
    x,
    y,
    width: cfg.width,
    height: cfg.height,
    energyCost: cfg.energyCost,
    vramCost: cfg.vramCost,
    heatPerTick: cfg.heatPerTick,
    inputPorts,
    outputPorts,
    recipeId,
  });

  state.buildings.push(building);
  state.credits -= cfg.buildCost;
  EventBus.emit(Events.BUILDING_PLACED, building);
  return building;
}

export function removeBuilding(state: GameState, buildingId: string): boolean {
  const idx = state.buildings.findIndex(b => b.id === buildingId);
  if (idx === -1) return false;

  const building = state.buildings[idx];
  const cfg = getBuildingConfig(building.type);
  if (cfg) {
    state.credits += Math.floor(cfg.buildCost * 0.5); // 50% refund
  }

  state.buildings.splice(idx, 1);
  state.buffers.delete(buildingId);
  EventBus.emit(Events.BUILDING_REMOVED, buildingId);
  return true;
}

export function placeConveyor(
  state: GameState,
  x: number,
  y: number,
  direction: ConveyorDirection
): Conveyor | null {
  const CONVEYOR_COST = 5;
  if (state.credits < CONVEYOR_COST) return null;

  // Check no existing conveyor here
  if (state.conveyors.find(c => c.x === x && c.y === y)) return null;

  const conv = new Conveyor(x, y, direction);
  state.conveyors.push(conv);
  state.credits -= CONVEYOR_COST;
  EventBus.emit(Events.CONVEYOR_PLACED, conv);
  return conv;
}

export function removeConveyor(state: GameState, x: number, y: number): boolean {
  const idx = state.conveyors.findIndex(c => c.x === x && c.y === y);
  if (idx === -1) return false;
  const conv = state.conveyors[idx];
  state.conveyors.splice(idx, 1);
  EventBus.emit(Events.CONVEYOR_REMOVED, conv);
  return true;
}

export function setIntegratorRecipe(
  state: GameState,
  buildingId: string,
  recipeId: string
): boolean {
  const building = state.buildings.find(b => b.id === buildingId);
  if (!building || building.type !== BuildingType.ModelIntegrator) return false;
  if (!state.unlockedRecipes.has(recipeId)) return false;
  building.recipeId = recipeId;
  building.cycleTick = 0;
  building.cycleBuffer = {};
  return true;
}

function overlaps(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function isCellOccupied(state: GameState, x: number, y: number): boolean {
  for (const b of state.buildings) {
    if (x >= b.x && x < b.x + b.width && y >= b.y && y < b.y + b.height) return true;
  }
  if (state.conveyors.find(c => c.x === x && c.y === y)) return true;
  if (state.splitters.find(s => s.x === x && s.y === y)) return true;
  if (state.mergers.find(m => m.x === x && m.y === y)) return true;
  return false;
}

const LOGISTICS_COST = 30;

export function placeSplitter(
  state: GameState,
  x: number,
  y: number,
  outputDirections: ConveyorDirection[]
): Splitter | null {
  if (state.credits < LOGISTICS_COST) return null;
  if (isCellOccupied(state, x, y)) return null;

  const splitter = new Splitter(nextId('splitter'), x, y, outputDirections);
  state.splitters.push(splitter);
  state.credits -= LOGISTICS_COST;
  EventBus.emit(Events.BUILDING_PLACED, splitter);
  return splitter;
}

export function removeSplitter(state: GameState, id: string): boolean {
  const idx = state.splitters.findIndex(s => s.id === id);
  if (idx === -1) return false;
  state.splitters.splice(idx, 1);
  state.buffers.delete(id);
  state.credits += Math.floor(LOGISTICS_COST * 0.5);
  return true;
}

export function placeMerger(
  state: GameState,
  x: number,
  y: number,
  inputDirections: [ConveyorDirection, ConveyorDirection],
  outputDirection: ConveyorDirection
): Merger | null {
  if (state.credits < LOGISTICS_COST) return null;
  if (isCellOccupied(state, x, y)) return null;

  const merger = new Merger(nextId('merger'), x, y, inputDirections, outputDirection);
  state.mergers.push(merger);
  state.credits -= LOGISTICS_COST;
  EventBus.emit(Events.BUILDING_PLACED, merger);
  return merger;
}

export function removeMerger(state: GameState, id: string): boolean {
  const idx = state.mergers.findIndex(m => m.id === id);
  if (idx === -1) return false;
  state.mergers.splice(idx, 1);
  state.buffers.delete(id);
  state.credits += Math.floor(LOGISTICS_COST * 0.5);
  return true;
}
