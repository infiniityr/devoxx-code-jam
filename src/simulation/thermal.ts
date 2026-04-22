import { Building } from '../entities/Building';

const HEAT_RADIUS = 3;
const HEAT_DISSIPATE_RATE = 2; // per tick passive dissipation

/** Accumulate and dissipate heat for each building based on neighbors */
export function updateThermal(buildings: Building[]): void {
  // Dissipate a bit every tick
  for (const b of buildings) {
    b.localHeat = Math.max(0, b.localHeat - HEAT_DISSIPATE_RATE);
  }

  // Add heat from generators
  for (const src of buildings) {
    if (!src.active || src.heatPerTick === 0) continue;

    for (const target of buildings) {
      const dist = Math.max(Math.abs(target.x - src.x), Math.abs(target.y - src.y));
      if (dist <= HEAT_RADIUS) {
        // heat falls off with distance
        const factor = 1 - dist / (HEAT_RADIUS + 1);
        target.localHeat = Math.min(100, target.localHeat + src.heatPerTick * factor);
      }
    }
  }

  // Apply overheat effects
  for (const b of buildings) {
    if (b.localHeat > 100) {
      b.overheat = true;
      b.active = false;
    } else if (b.localHeat > 80) {
      b.overheat = true;
      // 10% chance of stall per tick
      b.active = Math.random() > 0.1;
    } else {
      b.overheat = false;
      if (b.powered) b.active = true;
    }
  }
}

/** Quality modifier based on heat level (0–100 heat → modifier 0–1) */
export function heatQualityModifier(heat: number): number {
  if (heat < 60) return 1;
  if (heat < 80) return 0.95;
  return 0.85;
}
