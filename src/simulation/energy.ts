import { GameState } from './GameState';
import { Building, BuildingType } from '../entities/Building';

/** Recalculate energy consumption and apply blackout if needed */
export function updateEnergy(state: GameState): void {
  let consumed = 0;
  const capacity = state.energyCapacity;

  for (const b of state.buildings) {
    if (!b.active) continue;
    const cost = b.energyCost * state.techModifiers.powerEfficiency;
    consumed += cost;
  }

  state.energyUsed = consumed;

  if (consumed > capacity) {
    // blackout: disable most recently added buildings until under capacity
    let excess = consumed - capacity;
    for (let i = state.buildings.length - 1; i >= 0 && excess > 0; i--) {
      const b = state.buildings[i];
      if (b.type === BuildingType.PowerGenerator) continue;
      if (!b.powered) continue;
      b.powered = false;
      b.active = false;
      excess -= b.energyCost * state.techModifiers.powerEfficiency;
    }
  } else {
    // restore all powered buildings
    for (const b of state.buildings) {
      if (!b.powered) {
        b.powered = true;
        b.active = true;
      }
    }
  }
}

/** Recalculate total energy capacity from PowerGenerators */
export function recalcEnergyCapacity(buildings: Building[]): number {
  let cap = 100; // base capacity
  for (const b of buildings) {
    if (b.type === BuildingType.PowerGenerator && b.active) cap += 100;
  }
  return cap;
}

/** Recalculate total VRAM used */
export function recalcVramUsed(buildings: Building[]): number {
  let used = 0;
  for (const b of buildings) {
    if (b.active) used += b.vramCost;
  }
  return used;
}
