import Phaser from 'phaser';
import { Conveyor, ConveyorDirection } from '../entities/Conveyor';
import { TILE_SIZE } from './GridRenderer';

const SATURATION_COLORS = {
  full: 0xff3333,    // >100% — red
  high: 0xff8800,    // 50–99% — orange
  low: 0x44ff44,     // <50% — green
  empty: 0x555555,   // 0% — grey
};

export class ConveyorAnim {
  private scene: Phaser.Scene;
  conv: Conveyor;
  private graphics!: Phaser.GameObjects.Graphics;
  private arrow!: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, conv: Conveyor) {
    this.scene = scene;
    this.conv = conv;
    this.create();
  }

  private create(): void {
    this.graphics = this.scene.add.graphics();
    this.arrow = this.scene.add.text(
      this.conv.x * TILE_SIZE + TILE_SIZE / 2,
      this.conv.y * TILE_SIZE + TILE_SIZE / 2,
      this.directionArrow(),
      { fontSize: '12px', color: '#ffffff', fontFamily: 'monospace' }
    ).setOrigin(0.5, 0.5).setDepth(2);

    this.draw();
  }

  private directionArrow(): string {
    switch (this.conv.direction) {
      case ConveyorDirection.Right: return '→';
      case ConveyorDirection.Left:  return '←';
      case ConveyorDirection.Up:    return '↑';
      case ConveyorDirection.Down:  return '↓';
    }
  }

  draw(): void {
    const { x, y, saturation } = this.conv;
    const px = x * TILE_SIZE;
    const py = y * TILE_SIZE;

    let color: number;
    if (saturation <= 0) color = SATURATION_COLORS.empty;
    else if (saturation < 0.5) color = SATURATION_COLORS.low;
    else if (saturation < 1) color = SATURATION_COLORS.high;
    else color = SATURATION_COLORS.full;

    this.graphics.clear();
    this.graphics.fillStyle(color, 0.6);
    this.graphics.fillRect(px + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 8);
    this.graphics.lineStyle(1, color, 0.9);
    this.graphics.strokeRect(px + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 8);
  }

  update(): void {
    this.draw();
  }

  destroy(): void {
    this.graphics.destroy();
    this.arrow.destroy();
  }
}
