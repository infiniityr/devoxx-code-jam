import Phaser from 'phaser';
import { Building, BuildingType } from '../entities/Building';
import { TILE_SIZE } from './GridRenderer';
import { getAllBuildingConfigs } from '../simulation/techTree';

const BUILDING_COLORS: Partial<Record<BuildingType, number>> = {};
for (const cfg of getAllBuildingConfigs()) {
  BUILDING_COLORS[cfg.type as BuildingType] = cfg.color;
}

const BUILDING_LABELS: Partial<Record<BuildingType, string>> = {};
for (const cfg of getAllBuildingConfigs()) {
  BUILDING_LABELS[cfg.type as BuildingType] = cfg.label;
}

export class BuildingSprite {
  private scene: Phaser.Scene;
  building: Building;
  private container!: Phaser.GameObjects.Container;
  private rect!: Phaser.GameObjects.Graphics;
  private label!: Phaser.GameObjects.Text;
  private powerIcon!: Phaser.GameObjects.Text;
  private heatIcon!: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, building: Building) {
    this.scene = scene;
    this.building = building;
    this.create();
  }

  private create(): void {
    const { x, y, width, height, type } = this.building;
    const color = BUILDING_COLORS[type] ?? 0x888888;
    const labelText = BUILDING_LABELS[type] ?? type;

    const px = x * TILE_SIZE;
    const py = y * TILE_SIZE;
    const pw = width * TILE_SIZE;
    const ph = height * TILE_SIZE;

    this.rect = this.scene.add.graphics();
    this.drawRect(color);

    this.label = this.scene.add.text(px + pw / 2, py + ph / 2, labelText, {
      fontSize: '9px',
      color: '#ffffff',
      fontFamily: 'monospace',
      align: 'center',
      wordWrap: { width: pw - 4 },
    }).setOrigin(0.5, 0.5);

    this.powerIcon = this.scene.add.text(px + pw - 12, py + 2, '', {
      fontSize: '10px',
      color: '#ff4444',
    });

    this.heatIcon = this.scene.add.text(px + 2, py + 2, '', {
      fontSize: '10px',
    });

    this.container = this.scene.add.container(0, 0, [this.rect, this.label, this.powerIcon, this.heatIcon]);
    this.container.setDepth(1);
  }

  private drawRect(color: number): void {
    const { x, y, width, height } = this.building;
    const px = x * TILE_SIZE;
    const py = y * TILE_SIZE;
    const pw = width * TILE_SIZE;
    const ph = height * TILE_SIZE;

    this.rect.clear();
    this.rect.fillStyle(color, 0.85);
    this.rect.fillRoundedRect(px + 2, py + 2, pw - 4, ph - 4, 4);
    this.rect.lineStyle(2, 0xffffff, 0.3);
    this.rect.strokeRoundedRect(px + 2, py + 2, pw - 4, ph - 4, 4);
  }

  update(): void {
    const color = BUILDING_COLORS[this.building.type] ?? 0x888888;

    if (!this.building.powered) {
      this.rect.clear();
      this.rect.fillStyle(0x333333, 0.7);
      const { x, y, width, height } = this.building;
      this.rect.fillRoundedRect(
        x * TILE_SIZE + 2, y * TILE_SIZE + 2,
        width * TILE_SIZE - 4, height * TILE_SIZE - 4, 4
      );
      this.powerIcon.setText('⚡');
    } else {
      this.drawRect(color);
      this.powerIcon.setText('');
    }

    if (this.building.overheat) {
      this.heatIcon.setText('🌡');
    } else {
      this.heatIcon.setText('');
    }
  }

  destroy(): void {
    this.container.destroy();
  }

  setInteractive(callback: (b: Building) => void): void {
    const { x, y, width, height } = this.building;
    const zone = this.scene.add.zone(
      x * TILE_SIZE, y * TILE_SIZE,
      width * TILE_SIZE, height * TILE_SIZE
    ).setOrigin(0, 0).setInteractive();
    zone.on('pointerdown', () => callback(this.building));
    this.container.add(zone);
  }
}
