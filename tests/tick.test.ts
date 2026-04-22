import { describe, it, expect } from 'vitest';
import { createInitialState } from '../src/simulation/GameState';
import { updateTick } from '../src/simulation/tick';
import { placeBuilding } from '../src/simulation/world';
import { BuildingType } from '../src/entities/Building';

describe('tick engine', () => {
  it('increments ticks on each updateTick call', () => {
    const state = createInitialState();
    updateTick(state);
    expect(state.ticks).toBe(1);
    updateTick(state);
    expect(state.ticks).toBe(2);
  });

  it('a PowerGenerator increases energyCapacity', () => {
    const state = createInitialState();
    state.credits = 9999;
    placeBuilding(state, BuildingType.PowerGenerator, 5, 5);
    updateTick(state);
    expect(state.energyCapacity).toBe(200); // base 100 + generator 100
  });

  it('building is deactivated when energy exceeds capacity', () => {
    const state = createInitialState();
    state.credits = 99999;
    // Place 6 NeuronFabs (20W each = 120W) to exceed 100W base capacity
    // NeuronFab is 3x3, space every 4 tiles
    for (let i = 0; i < 6; i++) {
      placeBuilding(state, BuildingType.NeuronFab, i * 4, 0);
    }
    updateTick(state);
    // Some buildings should be deactivated
    const inactive = state.buildings.filter(b => !b.active);
    expect(inactive.length).toBeGreaterThan(0);
  });
});
