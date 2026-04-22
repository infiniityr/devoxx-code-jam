import { GameState, MarketEntry } from './GameState';

const PRICE_REBALANCE_TICKS = 600; // 60s at 10 TPS
const SUPPLY_PENALTY = 0.1;

/** Update market prices — called every tick */
export function updateMarket(state: GameState): void {
  for (const entry of state.market.values()) {
    // Record price history every 10 ticks
    if (state.ticks % 10 === 0) {
      entry.priceHistory.push(entry.currentPrice);
      if (entry.priceHistory.length > 300) entry.priceHistory.shift(); // keep 5 min
    }

    // Rebalance demand every 60s
    if (state.ticks % PRICE_REBALANCE_TICKS === 0) {
      // Slowly restore demand multiplier
      entry.demandMultiplier = Math.min(2, entry.demandMultiplier + 0.05);
      // Reduce supply count over time (market absorbs old supply)
      entry.supplyCount = Math.max(0, entry.supplyCount - 3);
    }
  }

  recalcPrices(state);
}

function recalcPrices(state: GameState): void {
  for (const entry of state.market.values()) {
    entry.currentPrice = Math.round(
      (entry.basePrice * entry.demandMultiplier) / (1 + entry.supplyCount * SUPPLY_PENALTY)
    );
    // Clamp to reasonable bounds
    entry.currentPrice = Math.max(50, entry.currentPrice);
  }
}

/**
 * Sell a model and credit the player.
 * Returns the price received.
 */
export function sellModel(
  state: GameState,
  modelId: string,
  quality: number
): number {
  const entry = state.market.get(modelId);
  if (!entry) return 0;

  const qualityMultiplier = quality / 100;
  const price = Math.round(entry.currentPrice * (0.5 + qualityMultiplier * 0.8));

  state.credits += price;
  state.researchPoints += 1;
  entry.supplyCount += 1;

  // Reduce demand slightly when too much supply
  if (entry.supplyCount > 5) {
    entry.demandMultiplier = Math.max(0.3, entry.demandMultiplier - 0.02);
  }

  recalcPrices(state);

  return price;
}

/** Get current price for a model */
export function getPrice(state: GameState, modelId: string): number {
  return state.market.get(modelId)?.currentPrice ?? 0;
}

/** Get market entry */
export function getMarketEntry(state: GameState, modelId: string): MarketEntry | undefined {
  return state.market.get(modelId);
}
