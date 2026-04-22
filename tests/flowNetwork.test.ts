import { describe, it, expect, beforeEach } from 'vitest';
import { createInitialState, GameState } from '../src/simulation/GameState';
import { updateFlowNetwork } from '../src/simulation/flowNetwork';
import { placeBuilding, placeConveyor } from '../src/simulation/world';
import { BuildingType, ResourceType } from '../src/entities/Building';
import { ConveyorDirection } from '../src/entities/Conveyor';

describe('flow network', () => {
  let state: GameState;

  beforeEach(() => {
    state = createInitialState();
    state.credits = 99999;
  });

  it('DataExtractor produces DataShards into its buffer', () => {
    placeBuilding(state, BuildingType.DataExtractor, 0, 0);
    updateFlowNetwork(state);
    const buf = state.buffers.get(state.buildings[0].id);
    expect(buf?.get(ResourceType.DataShard)).toBeGreaterThan(0);
  });

  it('Tokenizer consumes DataShards and produces Tokens', () => {
    const ext = placeBuilding(state, BuildingType.DataExtractor, 0, 0)!;
    const tok = placeBuilding(state, BuildingType.Tokenizer, 3, 0)!;

    // Pre-fill extractor buffer with DataShards
    const extBuf = new Map([[ResourceType.DataShard, 10]]);
    state.buffers.set(ext.id, extBuf);

    // Place conveyor connecting extractor output to tokenizer
    placeConveyor(state, 2, 0, ConveyorDirection.Right);

    // Run multiple ticks to allow flow
    for (let i = 0; i < 5; i++) updateFlowNetwork(state);

    const tokBuf = state.buffers.get(tok.id);
    expect(tokBuf?.get(ResourceType.Token)).toBeGreaterThan(0);
  });

  it('conveyor saturation is 0 when buffer is empty', () => {
    placeBuilding(state, BuildingType.DataExtractor, 0, 0);
    placeConveyor(state, 2, 0, ConveyorDirection.Right);
    updateFlowNetwork(state);
    const conv = state.conveyors[0];
    expect(conv.saturation).toBe(0);
  });

  it('conveyor saturation increases when buffer fills', () => {
    const ext = placeBuilding(state, BuildingType.DataExtractor, 0, 0)!;
    // Place conveyor inside the extractor's footprint (2x2 occupies 0,0 to 1,1)
    placeConveyor(state, 1, 0, ConveyorDirection.Right);

    // Fill buffer manually
    state.buffers.set(ext.id, new Map([[ResourceType.DataShard, 45]]));
    updateFlowNetwork(state);
    const conv = state.conveyors[0];
    expect(conv.saturation).toBeGreaterThan(0);
  });
});
