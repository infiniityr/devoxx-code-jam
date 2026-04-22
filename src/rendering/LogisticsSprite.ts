import Phaser from 'phaser';
import { Splitter, Merger } from '../entities/Logistics';
import { TILE_SIZE } from './GridRenderer';

type LogisticsEntity = Splitter | Merger;

export class LogisticsSprite {
  private scene: Phaser.Scene;
  entity: LogisticsEntity;
  private graphics!: Phaser.GameObjects.Graphics;
  private label!: Phaser.GameObjects.Text;
  private container!: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, entity: LogisticsEntity) {
    this.scene = scene;
    this.entity = entity;
    this.create();
  }

  private isSplitter(): this is { entity: Splitter } {
    return 'outputDirections' in this.entity;
  }

  private create(): void {
    const { x, y } = this.entity;
    const px = x * TILE_SIZE;
    const py = y * TILE_SIZE;

    const isSplitter = this.isSplitter();
    const color = isSplitter ? 0x00ccff : 0xaa44ff;
    const labelText = isSplitter ? '⇒' : '⇒';
    const text = isSplitter ? 'SPL' : 'MRG';

    this.graphics = this.scene.add.graphics();
    this.graphics.fillStyle(color, 0.9);
    this.graphics.fillRoundedRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4, 3);
    this.graphics.lineStyle(2, 0xffffff, 0.4);
    this.graphics.strokeRoundedRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4, 3);

    void labelText;

    this.label = this.scene.add.text(px + TILE_SIZE / 2, py + TILE_SIZE / 2, text, {
      fontSize: '7px',
      color: '#ffffff',
      fontFamily: 'monospace',
      align: 'center',
    }).setOrigin(0.5, 0.5);

    this.container = this.scene.add.container(0, 0, [this.graphics, this.label]);
    this.container.setDepth(1);
  }

  update(): void {
    // Could add visual feedback here (e.g., pulse when active)
  }

  setInteractive(callback: (entity: LogisticsEntity) => void): void {
    const { x, y } = this.entity;
    const zone = this.scene.add.zone(
      x * TILE_SIZE, y * TILE_SIZE,
      TILE_SIZE, TILE_SIZE
    ).setOrigin(0, 0).setInteractive();
    zone.on('pointerdown', () => callback(this.entity));
    this.container.add(zone);
  }

  destroy(): void {
    this.container.destroy();
  }
}
