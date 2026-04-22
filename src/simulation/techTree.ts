import { GameState } from './GameState';
import buildingsJson from '../data/buildings.json';
import techTreeJson from '../data/techTree.json';

interface TechNode {
  id: string;
  label: string;
  cost: number;
  tier: number;
  requires: string[];
  effect: string;
  value: number | string;
}

interface TechTree {
  tier1: TechNode[];
  tier2: TechNode[];
}

const techTree: TechTree = techTreeJson as TechTree;
const allNodes: TechNode[] = [...techTree.tier1, ...techTree.tier2];

export function getAllTechNodes(): TechNode[] {
  return allNodes;
}

export function getTechNode(id: string): TechNode | undefined {
  return allNodes.find(n => n.id === id);
}

export function canUnlock(state: GameState, nodeId: string): boolean {
  const node = getTechNode(nodeId);
  if (!node) return false;
  if (state.unlockedTech.has(nodeId)) return false;
  if (state.researchPoints < node.cost) return false;

  // Tier 2 requires 5 tier1 unlocks
  if (node.tier === 2) {
    const tier1Count = [...state.unlockedTech].filter(id =>
      techTree.tier1.some(n => n.id === id)
    ).length;
    if (tier1Count < 5) return false;
  }

  return true;
}

/**
 * Resets all tech modifiers to their defaults and re-applies every unlocked tech effect.
 * Must be called after loading a save that contains pre-unlocked tech nodes.
 */
export function recomputeTechModifiers(state: GameState): void {
  state.techModifiers.tokenizerSpeed = 1;
  state.techModifiers.conveyorSpeed = 1;
  state.techModifiers.bufferCapacity = 1;
  state.techModifiers.powerEfficiency = 1;
  state.techModifiers.vramBonus = 0;
  state.techModifiers.memoryBandwidth = 1;
  state.techModifiers.maxIntegrators = 1;
  state.vramCapacity = 16;

  for (const nodeId of state.unlockedTech) {
    const node = getTechNode(nodeId);
    if (!node) continue;
    switch (node.effect) {
      case 'tokenizerSpeed':     state.techModifiers.tokenizerSpeed     *= node.value as number; break;
      case 'conveyorSpeed':      state.techModifiers.conveyorSpeed      *= node.value as number; break;
      case 'bufferCapacity':     state.techModifiers.bufferCapacity     *= node.value as number; break;
      case 'powerEfficiency':    state.techModifiers.powerEfficiency    *= node.value as number; break;
      case 'vramBonus':          state.vramCapacity += node.value as number; state.techModifiers.vramBonus += node.value as number; break;
      case 'memoryBandwidth':    state.techModifiers.memoryBandwidth    *= node.value as number; break;
      case 'maxIntegrators':     state.techModifiers.maxIntegrators      = node.value as number; break;
      case 'unlockRecipe':       state.unlockedRecipes.add(node.value as string); break;
    }
  }
}

export function unlockTech(state: GameState, nodeId: string): boolean {
  if (!canUnlock(state, nodeId)) return false;
  const node = getTechNode(nodeId)!;

  state.researchPoints -= node.cost;
  state.unlockedTech.add(nodeId);

  // Apply effect
  switch (node.effect) {
    case 'tokenizerSpeed':
      state.techModifiers.tokenizerSpeed *= node.value as number;
      break;
    case 'conveyorSpeed':
      state.techModifiers.conveyorSpeed *= node.value as number;
      break;
    case 'bufferCapacity':
      state.techModifiers.bufferCapacity *= node.value as number;
      break;
    case 'powerEfficiency':
      state.techModifiers.powerEfficiency *= node.value as number;
      break;
    case 'vramBonus':
      state.vramCapacity += node.value as number;
      state.techModifiers.vramBonus += node.value as number;
      break;
    case 'memoryBandwidth':
      state.techModifiers.memoryBandwidth *= node.value as number;
      break;
    case 'maxIntegrators':
      state.techModifiers.maxIntegrators = node.value as number;
      break;
    case 'unlockRecipe':
      state.unlockedRecipes.add(node.value as string);
      break;
    case 'unlockBuilding':
      // Buildings are always available to place, this just marks as unlocked
      break;
  }

  return true;
}

export interface BuildingConfig {
  type: string;
  label: string;
  width: number;
  height: number;
  energyCost: number;
  buildCost: number;
  vramCost: number;
  heatPerTick: number;
  inputs: Array<{ resource: string; rate: number }>;
  outputs: Array<{ resource: string; rate: number }>;
  placementZone: string;
  color: number;
  category: string;
  energyOutput?: number;
}

export function getAllBuildingConfigs(): BuildingConfig[] {
  return buildingsJson as BuildingConfig[];
}

export function getBuildingConfig(type: string): BuildingConfig | undefined {
  return (buildingsJson as BuildingConfig[]).find(b => b.type === type);
}
