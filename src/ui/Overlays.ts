import Phaser from 'phaser';
import { GameState } from '../simulation/GameState';
import { Building } from '../entities/Building';
import { TILE_SIZE, GRID_W, GRID_H } from '../rendering/GridRenderer';

export type OverlayMode = 'throughput' | 'thermal' | 'vram' | 'energy' | 'none';

export class Overlays {
  private graphics: Phaser.GameObjects.Graphics;
  mode: OverlayMode = 'throughput';

  constructor(scene: Phaser.Scene) {
    this.graphics = scene.add.graphics().setDepth(3);
  }

  setMode(mode: OverlayMode): void {
    this.mode = mode;
  }

  update(state: GameState): void {
    const g = this.graphics;
    g.clear();

    if (this.mode === 'none') return;

    for (const b of state.buildings) {
      this.drawBuildingOverlay(g, b, state);
    }
  }

  private drawBuildingOverlay(
    g: Phaser.GameObjects.Graphics,
    b: Building,
    state: GameState
  ): void {
    const px = b.x * TILE_SIZE;
    const py = b.y * TILE_SIZE;
    const pw = b.width * TILE_SIZE;
    const ph = b.height * TILE_SIZE;

    switch (this.mode) {
      case 'thermal': {
        const heat = b.localHeat / 100;
        const color = heatColor(heat);
        g.fillStyle(color, 0.4 * heat);
        g.fillRect(px, py, pw, ph);
        break;
      }
      case 'vram': {
        const intensity = state.vramCapacity > 0 ? b.vramCost / state.vramCapacity : 0;
        g.fillStyle(0xaa44ff, 0.5 * intensity);
        g.fillRect(px, py, pw, ph);
        break;
      }
      case 'energy': {
        if (!b.powered) {
          g.fillStyle(0xff2200, 0.5);
          g.fillRect(px, py, pw, ph);
        }
        break;
      }
      case 'throughput': {
        // Handled per-conveyor in ConveyorAnim, nothing extra needed for buildings
        break;
      }
    }
  }

  // Draw heat halo on the full grid
  drawHeatGrid(state: GameState): void {
    if (this.mode !== 'thermal') return;
    const g = this.graphics;

    for (let ty = 0; ty < GRID_H; ty++) {
      for (let tx = 0; tx < GRID_W; tx++) {
        // Aggregate heat from nearby buildings
        let heat = 0;
        for (const b of state.buildings) {
          const dist = Math.max(Math.abs(b.x - tx), Math.abs(b.y - ty));
          if (dist <= 3) {
            heat = Math.max(heat, b.localHeat * (1 - dist / 4));
          }
        }
        if (heat > 10) {
          const alpha = (heat / 100) * 0.3;
          g.fillStyle(heatColor(heat / 100), alpha);
          g.fillRect(tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
      }
    }
  }

  destroy(): void {
    this.graphics.destroy();
  }
}

function heatColor(t: number): number {
  // 0 = green-blue, 0.5 = orange, 1 = red
  const r = Math.min(255, Math.floor(t * 2 * 255));
  const g = Math.min(255, Math.floor((1 - Math.abs(t - 0.5) * 2) * 180));
  const b = Math.floor((1 - t) * 100);
  return (r << 16) | (g << 8) | b;
}
