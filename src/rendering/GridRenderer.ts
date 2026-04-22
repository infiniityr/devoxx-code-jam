import Phaser from 'phaser';

export const TILE_SIZE = 32;
export const GRID_W = 32;
export const GRID_H = 32;

// Zone tile types
export const enum ZoneType {
  Open = 0,
  DataNode = 1,
  SiliconVein = 2,
}

type ZoneGrid = ZoneType[][];

/** Generate zone grid from a seed (simple LCG) */
export function generateZones(seed: number): ZoneGrid {
  const grid: ZoneGrid = Array.from({ length: GRID_H }, () =>
    Array(GRID_W).fill(ZoneType.Open)
  );

  let rng = seed;
  function next(): number {
    rng = (rng * 1664525 + 1013904223) & 0xffffffff;
    return (rng >>> 0) / 0xffffffff;
  }

  const dataNodes = 8;
  const siliconVeins = 6;

  for (let i = 0; i < dataNodes; i++) {
    const x = Math.floor(next() * (GRID_W - 2)) + 1;
    const y = Math.floor(next() * (GRID_H - 2)) + 1;
    grid[y][x] = ZoneType.DataNode;
  }
  for (let i = 0; i < siliconVeins; i++) {
    const x = Math.floor(next() * (GRID_W - 2)) + 1;
    const y = Math.floor(next() * (GRID_H - 2)) + 1;
    if (grid[y][x] === ZoneType.Open) grid[y][x] = ZoneType.SiliconVein;
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
    this.zoneGraphics = this.scene.add.graphics();
    this.gridGraphics = this.scene.add.graphics();
    this.drawZones();
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
          // Icon
          g.fillStyle(0x00ccff, 0.8);
          g.fillRect(x * TILE_SIZE + 12, y * TILE_SIZE + 12, 8, 8);
        } else if (zone === ZoneType.SiliconVein) {
          g.fillStyle(0x332200, 0.6);
          g.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
          g.fillStyle(0x8b6914, 0.8);
          g.fillRect(x * TILE_SIZE + 10, y * TILE_SIZE + 10, 12, 12);
        }
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
