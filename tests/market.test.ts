import { describe, it, expect, beforeEach } from 'vitest';
import { createInitialState, GameState } from '../src/simulation/GameState';
import { sellModel, updateMarket, getPrice } from '../src/simulation/market';

describe('market', () => {
  let state: GameState;

  beforeEach(() => {
    state = createInitialState();
  });

  it('selling a model credits the player', () => {
    const before = state.credits;
    sellModel(state, 'mlp', 80);
    expect(state.credits).toBeGreaterThan(before);
  });

  it('selling a model awards research points', () => {
    expect(state.researchPoints).toBe(0);
    sellModel(state, 'mlp', 80);
    expect(state.researchPoints).toBe(1);
  });

  it('price decreases with excess supply', () => {
    const initialPrice = getPrice(state, 'mlp');
    // Flood the market
    for (let i = 0; i < 20; i++) sellModel(state, 'mlp', 80);
    const newPrice = getPrice(state, 'mlp');
    expect(newPrice).toBeLessThan(initialPrice);
  });

  it('price recovers after market rebalance ticks', () => {
    // Flood supply
    for (let i = 0; i < 10; i++) sellModel(state, 'mlp', 80);
    const depressedPrice = getPrice(state, 'mlp');

    // Advance 600+ ticks (rebalance interval)
    state.ticks = 599;
    updateMarket(state);
    state.ticks = 600;
    updateMarket(state);

    const recoveredPrice = getPrice(state, 'mlp');
    expect(recoveredPrice).toBeGreaterThan(depressedPrice);
  });

  it('higher quality model earns more credits', () => {
    const s1 = createInitialState();
    const s2 = createInitialState();
    sellModel(s1, 'mlp', 20);
    sellModel(s2, 'mlp', 90);
    expect(s2.credits).toBeGreaterThan(s1.credits);
  });
});
