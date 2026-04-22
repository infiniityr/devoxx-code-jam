import { GameState } from './GameState';
import { Building, BuildingType, ResourceType } from '../entities/Building';
import { updateFlowNetwork } from './flowNetwork';
import { updateEnergy, recalcEnergyCapacity, recalcVramUsed } from './energy';
import { updateThermal, heatQualityModifier } from './thermal';
import { updateMarket, sellModel } from './market';
import { EventBus, Events } from '../EventBus';
import recipesJson from '../data/recipes.json';
import { Recipe } from '../entities/Recipe';

const recipes: Recipe[] = recipesJson as Recipe[];

function getRecipe(id: string): Recipe | undefined {
  return recipes.find(r => r.id === id);
}

function getBuffer(state: GameState, buildingId: string): Map<ResourceType, number> {
  let buf = state.buffers.get(buildingId);
  if (!buf) {
    buf = new Map();
    state.buffers.set(buildingId, buf);
  }
  return buf;
}

function bufferGet(buf: Map<ResourceType, number>, r: ResourceType): number {
  return buf.get(r) ?? 0;
}

/** Process one Model Integrator tick */
function processIntegrator(building: Building, state: GameState): void {
  if (!building.recipeId) return;
  const recipe = getRecipe(building.recipeId);
  if (!recipe) return;

  if (!state.unlockedRecipes.has(recipe.id)) return;

  // VRAM check
  if (recipe.vramRequired > state.vramCapacity - state.vramUsed + building.vramCost) return;

  building.cycleTick = (building.cycleTick ?? 0) + 1;

  const buf = getBuffer(state, building.id);

  // Accumulate inputs into cycle buffer each tick
  if (!building.cycleBuffer) building.cycleBuffer = {};

  for (const input of recipe.inputs) {
    const available = bufferGet(buf, input.resource as ResourceType);
    const needed = input.amount / recipe.cycleTicks;
    const take = Math.min(available, needed);
    buf.set(input.resource as ResourceType, available - take);
    building.cycleBuffer[input.resource as ResourceType] =
      (building.cycleBuffer[input.resource as ResourceType] ?? 0) + take;
  }

  // Check cycle completion
  if ((building.cycleTick ?? 0) >= recipe.cycleTicks) {
    // Check if we accumulated enough
    let satisfied = true;
    for (const input of recipe.inputs) {
      const accumulated = building.cycleBuffer[input.resource as ResourceType] ?? 0;
      if (accumulated < input.amount * 0.8) {
        // 80% threshold — chain saturation penalty
        satisfied = false;
      }
    }

    if (satisfied) {
      // Quality calculation
      const heatMod = heatQualityModifier(building.localHeat);
      const quality =
        Math.floor(
          (recipe.qualityMin + Math.random() * (recipe.qualityMax - recipe.qualityMin)) * heatMod
        );

      // Auto-sell or queue
      const entry = state.market.get(recipe.id);
      if (entry?.autoSell) {
        const price = sellModel(state, recipe.id, quality);
        EventBus.emit(Events.MODEL_SOLD, { modelId: recipe.id, price, quality });
      }

      state.modelsPerTick = 1 / recipe.cycleTicks;
      state.avgLatency = updateLatency(state, recipe.latencyMs);
    }

    // Reset cycle
    building.cycleTick = 0;
    building.cycleBuffer = {};
  }
}

function updateLatency(state: GameState, newLatency: number): number {
  state.latencyHistory.push(newLatency);
  if (state.latencyHistory.length > 10) state.latencyHistory.shift();
  return state.latencyHistory.reduce((a, b) => a + b, 0) / state.latencyHistory.length;
}

let _interval: ReturnType<typeof setInterval> | null = null;

/** Start the simulation loop at 10 TPS */
export function startTickLoop(state: GameState): void {
  if (_interval) return;
  _interval = setInterval(() => updateTick(state), 1000 / state.tps);
}

export function stopTickLoop(): void {
  if (_interval) {
    clearInterval(_interval);
    _interval = null;
  }
}

/** Core simulation step — pure logic, no Phaser */
export function updateTick(state: GameState): void {
  state.ticks += 1;

  // Recalculate energy capacity and VRAM
  state.energyCapacity = recalcEnergyCapacity(state.buildings);
  state.vramUsed = recalcVramUsed(state.buildings);

  // Energy management
  updateEnergy(state);

  // Thermal management
  updateThermal(state.buildings);

  // Flow network
  updateFlowNetwork(state);

  // Model Integrators
  for (const b of state.buildings) {
    if (b.type === BuildingType.ModelIntegrator && b.active) {
      processIntegrator(b, state);
    }
  }

  // Market
  updateMarket(state);

  // Emit tick event for renderer
  EventBus.emit(Events.TICK, state);
}
