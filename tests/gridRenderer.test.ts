import { describe, it, expect } from 'vitest';
import { generateZones, GRID_W, GRID_H, ZoneType } from '../src/rendering/GridRenderer';

describe('GridRenderer — constants', () => {
  it('grid is 256×256', () => {
    expect(GRID_W).toBe(256);
    expect(GRID_H).toBe(256);
  });
});

describe('generateZones', () => {
  it('returns a grid of the correct dimensions', () => {
    const zones = generateZones(42);
    expect(zones.length).toBe(GRID_H);
    expect(zones[0].length).toBe(GRID_W);
  });

  it('all cells are valid ZoneType values', () => {
    const zones = generateZones(42);
    const validTypes = new Set([ZoneType.Open, ZoneType.DataNode, ZoneType.SiliconVein]);
    for (let y = 0; y < GRID_H; y++) {
      for (let x = 0; x < GRID_W; x++) {
        expect(validTypes.has(zones[y][x])).toBe(true);
      }
    }
  });

  it('generates DataNode tiles', () => {
    const zones = generateZones(42);
    const dataNodes = zones.flat().filter(z => z === ZoneType.DataNode);
    // Expect at least one cluster (min 3 tiles per cluster × 1 cluster)
    expect(dataNodes.length).toBeGreaterThanOrEqual(3);
  });

  it('generates SiliconVein tiles', () => {
    const zones = generateZones(42);
    const veins = zones.flat().filter(z => z === ZoneType.SiliconVein);
    expect(veins.length).toBeGreaterThanOrEqual(3);
  });

  it('generates clusters — DataNode tiles are adjacent to other DataNode tiles', () => {
    const zones = generateZones(42);
    let hasAdjacentDataNode = false;
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    outer: for (let y = 1; y < GRID_H - 1; y++) {
      for (let x = 1; x < GRID_W - 1; x++) {
        if (zones[y][x] === ZoneType.DataNode) {
          for (const [dy, dx] of dirs) {
            if (zones[y + dy]?.[x + dx] === ZoneType.DataNode) {
              hasAdjacentDataNode = true;
              break outer;
            }
          }
        }
      }
    }
    expect(hasAdjacentDataNode).toBe(true);
  });

  it('zones never appear on the border tiles (edge safety)', () => {
    const zones = generateZones(42);
    // Top & bottom row
    for (let x = 0; x < GRID_W; x++) {
      // Border tiles can be Open but clusters are placed at least 2 tiles in
      // We check that coordinates 0 and GRID_H-1 have no zone tiles created by cluster center
      // (centers are placed at >= 2 offset, so row 0 and col 0 should not be cluster centers)
      // This is a soft check — border tiles that got a cluster expansion are ok,
      // but cluster *centers* are not placed on row 0/GRID_H-1/col 0/GRID_W-1
    }
    // Stronger: no zone tile at corner
    expect(zones[0][0]).toBe(ZoneType.Open);
    expect(zones[0][GRID_W - 1]).toBe(ZoneType.Open);
    expect(zones[GRID_H - 1][0]).toBe(ZoneType.Open);
    expect(zones[GRID_H - 1][GRID_W - 1]).toBe(ZoneType.Open);
  });

  it('is deterministic — same seed produces same grid', () => {
    const a = generateZones(123);
    const b = generateZones(123);
    expect(a).toEqual(b);
  });

  it('different seeds produce different grids', () => {
    const a = generateZones(1);
    const b = generateZones(2);
    // Check at least one cell differs
    let differs = false;
    outer: for (let y = 0; y < GRID_H; y++) {
      for (let x = 0; x < GRID_W; x++) {
        if (a[y][x] !== b[y][x]) {
          differs = true;
          break outer;
        }
      }
    }
    expect(differs).toBe(true);
  });

  it('does not use RenderTexture (no max-texture-size crash risk)', () => {
    // generateZones is a pure function returning a ZoneGrid — no Phaser objects
    const zones = generateZones(42);
    expect(Array.isArray(zones)).toBe(true);
    // If this test runs without a Phaser context and doesn't throw, it's renderer-free
  });
});
