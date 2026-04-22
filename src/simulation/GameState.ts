import { Building, ResourceType } from '../entities/Building';
import { Conveyor } from '../entities/Conveyor';
import { Splitter, Merger } from '../entities/Logistics';

export interface MarketEntry {
  modelId: string;
  basePrice: number;
  currentPrice: number;
  supplyCount: number;
  demandMultiplier: number;
  autoSell: boolean;
  priceHistory: number[];
}

export interface TechModifiers {
  tokenizerSpeed: number;
  conveyorSpeed: number;
  bufferCapacity: number;
  powerEfficiency: number;
  vramBonus: number;
  memoryBandwidth: number;
  maxIntegrators: number;
}

export interface GameState {
  ticks: number;
  credits: number;
  researchPoints: number;
  unlockedTech: Set<string>;
  unlockedRecipes: Set<string>;

  vramCapacity: number;
  vramUsed: number;
  energyCapacity: number;
  energyUsed: number;

  buildings: Building[];
  conveyors: Conveyor[];
  splitters: Splitter[];
  mergers: Merger[];

  // resource buffers: buildingId -> resource -> count
  buffers: Map<string, Map<ResourceType, number>>;

  market: Map<string, MarketEntry>;
  techModifiers: TechModifiers;

  // ticks per second (sim rate)
  tps: number;
  // rolling average latency from last 10 sold models
  avgLatency: number;
  latencyHistory: number[];
  // models produced per tick (rolling)
  modelsPerTick: number;

  // global resource flow stats for HUD
  tokensPerSecond: number;

  seed: number;
}

export function createInitialState(seed: number = 42): GameState {
  return {
    ticks: 0,
    credits: 500,
    researchPoints: 0,
    unlockedTech: new Set(),
    unlockedRecipes: new Set(['mlp', 'cnn', 'transformer']),

    vramCapacity: 16,
    vramUsed: 0,
    energyCapacity: 100,
    energyUsed: 0,

    buildings: [],
    conveyors: [],
    splitters: [],
    mergers: [],
    buffers: new Map(),
    market: new Map([
      ['mlp', { modelId: 'mlp', basePrice: 300, currentPrice: 300, supplyCount: 0, demandMultiplier: 1, autoSell: true, priceHistory: [] }],
      ['cnn', { modelId: 'cnn', basePrice: 700, currentPrice: 700, supplyCount: 0, demandMultiplier: 1, autoSell: true, priceHistory: [] }],
      ['transformer', { modelId: 'transformer', basePrice: 3500, currentPrice: 3500, supplyCount: 0, demandMultiplier: 1, autoSell: true, priceHistory: [] }],
      ['lite', { modelId: 'lite', basePrice: 225, currentPrice: 225, supplyCount: 0, demandMultiplier: 1, autoSell: true, priceHistory: [] }],
    ]),
    techModifiers: {
      tokenizerSpeed: 1,
      conveyorSpeed: 1,
      bufferCapacity: 1,
      powerEfficiency: 1,
      vramBonus: 0,
      memoryBandwidth: 1,
      maxIntegrators: 1,
    },

    tps: 10,
    avgLatency: 0,
    latencyHistory: [],
    modelsPerTick: 0,
    tokensPerSecond: 0,
    seed,
  };
}
