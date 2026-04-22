import Phaser from 'phaser';

export const TILE_SIZE = 32;
export const GRID_W = 256;
export const GRID_H = 256;

// Zone tile types
export const enum ZoneType {
  Open = 0,
  DataNode = 1,
  SiliconVein = 2,
}

export type ZoneGrid = ZoneType[][];

/** Place a cluster of 3–5 tiles of the given zone type around a center point */
function placeCluster(
  grid: ZoneGrid,
  cx: number,
  cy: number,
  type: ZoneType,
  size: number,
  next: () => number
): void {
  grid[cy][cx] = type;
  const offsets = [
    [-1, 0], [1, 0], [0, -1], [0, 1],
    [-1, -1], [1, -1], [-1, 1], [1, 1],
  ];
  // Shuffle offsets
  for (let i = offsets.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [offsets[i], offsets[j]] = [offsets[j], offsets[i]];
  }
  let placed = 1;
  for (const [dx, dy] of offsets) {
    if (placed >= size) break;
    const nx = cx + dx;
    const ny = cy + dy;
    if (nx > 0 && ny > 0 && nx < GRID_W - 1 && ny < GRID_H - 1 && grid[ny][nx] === ZoneType.Open) {
      grid[ny][nx] = type;
      placed++;
    }
  }
}

/** Generate zone grid from a seed — clusters arranged along an Archimedean spiral */
export function generateZones(seed: number): ZoneGrid {
  const grid: ZoneGrid = Array.from({ length: GRID_H }, () =>
    Array(GRID_W).fill(ZoneType.Open)
  );

  let rng = seed;
  function next(): number {
    rng = (rng * 1664525 + 1013904223) & 0xffffffff;
    return (rng >>> 0) / 0xffffffff;
  }

  // Archimedean spiral: r = a * θ, centered at grid center
  // 3 full turns, ~46 clusters total (doubles previous density)
  const totalClusters = 46;
  const turns = 3;
  const cx = GRID_W / 2;
  const cy = GRID_H / 2;
  const maxRadius = 110; // tiles from center — stays within 256×256 bounds
  const thetaMax = turns * 2 * Math.PI;
  const a = maxRadius / thetaMax;
  const angleStep = thetaMax / totalClusters;

  for (let i = 1; i <= totalClusters; i++) {
    const theta = i * angleStep;
    const r = a * theta;
    const rawX = Math.round(cx + r * Math.cos(theta));
    const rawY = Math.round(cy + r * Math.sin(theta));

    // Clamp to valid bounds
    const x = Math.max(2, Math.min(GRID_W - 3, rawX));
    const y = Math.max(2, Math.min(GRID_H - 3, rawY));

    // Alternate types: even index → DataNode, odd → SiliconVein
    const type = i % 2 === 0 ? ZoneType.DataNode : ZoneType.SiliconVein;
    const size = 3 + Math.floor(next() * 3); // 3–5, seed-driven
    placeCluster(grid, x, y, type, size, next);
  }

  return grid;
}

export class GridRenderer {
  private scene: Phaser.Scene;
  private gridGraphics!: Phaser.GameObjects.Graphics;
  private zoneGraphics!: Phaser.GameObjects.Graphics;
  zones: ZoneGrid;

  constructor(scene: Phaser.Scene, seed: number) {
    this.scene = scene;
    this.zones = generateZones(seed);
    this.create();
  }

  private create(): void {
    // Zones: drawn once as a sparse Graphics (only ~100 non-Open tiles drawn)
    this.zoneGraphics = this.scene.add.graphics();
    this.drawZones();

    // Grid lines: drawn once into a Graphics object
    this.gridGraphics = this.scene.add.graphics();
    this.drawGrid();
  }

  private drawZones(): void {
    const g = this.zoneGraphics;
    g.clear();

    for (let y = 0; y < GRID_H; y++) {
      for (let x = 0; x < GRID_W; x++) {
        const zone = this.zones[y][x];
        if (zone === ZoneType.DataNode) {
          g.fillStyle(0x003355, 0.6);
          g.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
          g.fillStyle(0x00ccff, 0.8);
          g.fillRect(x * TILE_SIZE + 12, y * TILE_SIZE + 12, 8, 8);
        } else if (zone === ZoneType.SiliconVein) {
          g.fillStyle(0x332200, 0.6);
          g.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
          g.fillStyle(0x8b6914, 0.8);
          g.fillRect(x * TILE_SIZE + 10, y * TILE_SIZE + 10, 12, 12);
        }
        // ZoneType.Open tiles are not drawn — background color suffices
      }
    }
  }

  private drawGrid(): void {
    const g = this.gridGraphics;
    g.clear();
    g.lineStyle(1, 0x1a1a2e, 0.5);

    for (let x = 0; x <= GRID_W; x++) {
      g.beginPath();
      g.moveTo(x * TILE_SIZE, 0);
      g.lineTo(x * TILE_SIZE, GRID_H * TILE_SIZE);
      g.strokePath();
    }
    for (let y = 0; y <= GRID_H; y++) {
      g.beginPath();
      g.moveTo(0, y * TILE_SIZE);
      g.lineTo(GRID_W * TILE_SIZE, y * TILE_SIZE);
      g.strokePath();
    }
  }

  getZone(x: number, y: number): ZoneType {
    if (x < 0 || y < 0 || x >= GRID_W || y >= GRID_H) return ZoneType.Open;
    return this.zones[y][x];
  }
}
