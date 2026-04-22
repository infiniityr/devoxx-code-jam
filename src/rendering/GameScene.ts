import Phaser from 'phaser';
import { GameState, createInitialState } from '../simulation/GameState';
import { startTickLoop, stopTickLoop } from '../simulation/tick';
import { placeBuilding, placeConveyor } from '../simulation/world';
import { saveGame, loadGame, applyLoad, maybeAutosave } from '../simulation/save';
import { EventBus, Events } from '../EventBus';
import { Building, BuildingType } from '../entities/Building';
import { ConveyorDirection } from '../entities/Conveyor';
import { GridRenderer, TILE_SIZE, GRID_W, GRID_H, ZoneType } from '../rendering/GridRenderer';
import { BuildingSprite } from '../rendering/BuildingSprite';
import { ConveyorAnim } from '../rendering/ConveyorAnim';
import { HUD } from '../ui/HUD';
import { BuildPanel, PlacementMode } from '../ui/BuildPanel';
import { Overlays } from '../ui/Overlays';
import { MarketPanel } from '../ui/MarketPanel';
import { TechPanel } from '../ui/TechPanel';
import { InfoPanel } from '../ui/InfoPanel';

export class GameScene extends Phaser.Scene {
  private state!: GameState;
  private gridRenderer!: GridRenderer;
  private buildingSprites: Map<string, BuildingSprite> = new Map();
  private conveyorAnims: Map<string, ConveyorAnim> = new Map();
  private hud!: HUD;
  private buildPanel!: BuildPanel;
  private overlays!: Overlays;
  private marketPanel!: MarketPanel;
  private techPanel!: TechPanel;
  private infoPanel!: InfoPanel;

  private placementMode: PlacementMode = { active: false };
  private conveyorMode: boolean = false;
  private conveyorDirection: ConveyorDirection = ConveyorDirection.Right;
  private previewGraphics!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    // Phaser dark background
    this.cameras.main.setBackgroundColor('#0a0a14');

    // State
    const saved = loadGame();
    this.state = createInitialState(42);
    if (saved) applyLoad(this.state, saved);

    // Grid
    this.gridRenderer = new GridRenderer(this, this.state.seed);

    // Preview graphics
    this.previewGraphics = this.add.graphics().setDepth(10);

    // UI
    this.hud = new HUD();
    this.buildPanel = new BuildPanel((mode) => {
      this.placementMode = mode;
      this.conveyorMode = false;
    });
    this.overlays = new Overlays(this);
    this.marketPanel = new MarketPanel();
    this.techPanel = new TechPanel();
    this.infoPanel = new InfoPanel((id) => {
      this.buildingSprites.get(id)?.destroy();
      this.buildingSprites.delete(id);
    });

    // Rebuild sprites from loaded state
    for (const b of this.state.buildings) {
      this.spawnBuildingSprite(b);
    }

    // Camera setup
    const worldW = GRID_W * TILE_SIZE;
    const worldH = GRID_H * TILE_SIZE;
    this.cameras.main.setBounds(0, 0, worldW, worldH);
    this.cameras.main.setZoom(1.5);
    this.cameras.main.centerOn(worldW / 2, worldH / 2);

    // Input
    this.setupInput();

    // EventBus
    EventBus.on(Events.TICK, () => this.onTick());
    EventBus.on(Events.MODEL_SOLD, (data: unknown) => {
      const { modelId, price } = data as { modelId: string; price: number };
      this.hud.showAlert(`✅ Modèle ${modelId.toUpperCase()} vendu — ${price} 💎`);
    });
    EventBus.on(Events.BUILDING_PLACED, (b: unknown) => {
      this.spawnBuildingSprite(b as Building);
    });

    startTickLoop(this.state);
  }

  private onTick(): void {
    // Update all sprites
    for (const [, sprite] of this.buildingSprites) sprite.update();
    for (const [, anim] of this.conveyorAnims) anim.update();
    this.hud.update(this.state);
    this.buildPanel.render(this.state);
    this.overlays.update(this.state);
    this.overlays.drawHeatGrid(this.state);
    this.marketPanel.update(this.state);
    this.techPanel.update(this.state);
    this.infoPanel.update();
    maybeAutosave(this.state);
  }

  private spawnBuildingSprite(b: Building): void {
    const sprite = new BuildingSprite(this, b);
    sprite.setInteractive((building) => {
      if (this.placementMode.active || this.conveyorMode) return;
      this.infoPanel.show(building, this.state);
    });
    this.buildingSprites.set(b.id, sprite);
  }

  private setupInput(): void {
    const cam = this.cameras.main;

    // Mouse wheel zoom
    this.input.on('wheel', (_ptr: Phaser.Input.Pointer, _objs: unknown, _dx: number, dy: number) => {
      const newZoom = Phaser.Math.Clamp(cam.zoom - dy * 0.001, 0.25, 4);
      cam.setZoom(newZoom);
    });

    // Right-click pan
    let panning = false;
    let panStart = { x: 0, y: 0, camX: 0, camY: 0 };

    this.input.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      if (ptr.rightButtonDown()) {
        panning = true;
        panStart = { x: ptr.x, y: ptr.y, camX: cam.scrollX, camY: cam.scrollY };
        this.placementMode = { active: false };
        this.conveyorMode = false;
        this.buildPanel.deselect();
        this.infoPanel.hide();
      }
    });

    this.input.on('pointermove', (ptr: Phaser.Input.Pointer) => {
      if (panning) {
        const dx = (ptr.x - panStart.x) / cam.zoom;
        const dy = (ptr.y - panStart.y) / cam.zoom;
        cam.setScroll(panStart.camX - dx, panStart.camY - dy);
      }
      this.updatePreview(ptr);
    });

    this.input.on('pointerup', (ptr: Phaser.Input.Pointer) => {
      if (ptr.rightButtonDown()) panning = false;
    });

    this.input.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      if (ptr.leftButtonDown()) this.handleLeftClick(ptr);
    });

    // Keyboard
    const keys = this.input.keyboard!;

    keys.on('keydown-ESC', () => {
      this.placementMode = { active: false };
      this.conveyorMode = false;
      this.buildPanel.deselect();
      this.infoPanel.hide();
      this.previewGraphics.clear();
    });

    keys.on('keydown-R', () => {
      const dirs = [ConveyorDirection.Right, ConveyorDirection.Down, ConveyorDirection.Left, ConveyorDirection.Up];
      const idx = dirs.indexOf(this.conveyorDirection);
      this.conveyorDirection = dirs[(idx + 1) % 4];
    });

    keys.on('keydown-C', () => {
      this.placementMode = { active: false };
      this.buildPanel.deselect();
      this.conveyorMode = true;
    });

    keys.on('keydown-T', () => {
      this.techPanel.toggle();
      this.marketPanel['visible'] && this.marketPanel.toggle();
    });

    keys.on('keydown-M', () => {
      this.marketPanel.toggle();
      this.techPanel['visible'] && this.techPanel.toggle();
    });

    keys.on('keydown-S', () => {
      saveGame(this.state);
      this.hud.showAlert('💾 Partie sauvegardée');
    });

    keys.on('keydown-ONE', () => this.overlays.setMode('throughput'));
    keys.on('keydown-TWO', () => this.overlays.setMode('thermal'));
    keys.on('keydown-THREE', () => this.overlays.setMode('vram'));
    keys.on('keydown-FOUR', () => this.overlays.setMode('energy'));

    // WASD pan
    this.input.keyboard!.addKeys('W,A,S,D');
  }

  update(): void {
    const cam = this.cameras.main;
    const speed = 4 / cam.zoom;
    const keys = this.input.keyboard!;

    if (keys.addKey('W').isDown) cam.scrollY -= speed;
    if (keys.addKey('S').isDown) cam.scrollY += speed;
    if (keys.addKey('A').isDown) cam.scrollX -= speed;
    if (keys.addKey('D').isDown) cam.scrollX += speed;
  }

  private handleLeftClick(ptr: Phaser.Input.Pointer): void {
    const worldPos = this.cameras.main.getWorldPoint(ptr.x, ptr.y);
    const tileX = Math.floor(worldPos.x / TILE_SIZE);
    const tileY = Math.floor(worldPos.y / TILE_SIZE);

    if (tileX < 0 || tileY < 0 || tileX >= GRID_W || tileY >= GRID_H) return;

    if (this.conveyorMode) {
      const conv = placeConveyor(this.state, tileX, tileY, this.conveyorDirection);
      if (conv) {
        const key = `${tileX},${tileY}`;
        const anim = new ConveyorAnim(this, conv);
        this.conveyorAnims.set(key, anim);
      }
      return;
    }

    if (this.placementMode.active) {
      const { buildingType, config } = this.placementMode;

      // Zone check
      const zone = this.gridRenderer.getZone(tileX, tileY);
      if (config.placementZone === 'DataNode' && zone !== ZoneType.DataNode) {
        this.hud.showAlert('⚠️ Data Extractor doit être placé sur un Data Node (case cyan)');
        return;
      }
      if (config.placementZone === 'SiliconVein' && zone !== ZoneType.SiliconVein) {
        this.hud.showAlert('⚠️ Silicon Mine doit être placé sur une Silicon Vein (case marron)');
        return;
      }

      const building = placeBuilding(this.state, buildingType, tileX, tileY);
      if (!building) {
        if (this.state.credits < config.buildCost) {
          this.hud.showAlert(`⚠️ Crédits insuffisants — besoin de ${config.buildCost} 💎`);
        }
        return;
      }

      // Auto-set first recipe for Model Integrator
      if (buildingType === BuildingType.ModelIntegrator) {
        building.recipeId = [...this.state.unlockedRecipes][0];
      }
    }
  }

  private updatePreview(ptr: Phaser.Input.Pointer): void {
    this.previewGraphics.clear();
    const worldPos = this.cameras.main.getWorldPoint(ptr.x, ptr.y);
    const tileX = Math.floor(worldPos.x / TILE_SIZE);
    const tileY = Math.floor(worldPos.y / TILE_SIZE);

    if (this.conveyorMode) {
      const arrow = ['→', '↓', '←', '↑'];
      const dirs = [ConveyorDirection.Right, ConveyorDirection.Down, ConveyorDirection.Left, ConveyorDirection.Up];
      const arrowIdx = dirs.indexOf(this.conveyorDirection);
      this.previewGraphics.fillStyle(0x4488ff, 0.4);
      this.previewGraphics.fillRect(tileX * TILE_SIZE, tileY * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      this.previewGraphics.lineStyle(1, 0x4488ff);
      this.previewGraphics.strokeRect(tileX * TILE_SIZE, tileY * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      void arrow[arrowIdx]; // rendered by text elsewhere
      return;
    }

    if (!this.placementMode.active) return;
    const { config } = this.placementMode;

    const pw = config.width * TILE_SIZE;
    const ph = config.height * TILE_SIZE;
    const valid = this.isValidPlacement(tileX, tileY, config.width, config.height, config.placementZone);

    this.previewGraphics.fillStyle(valid ? 0x44ff44 : 0xff4444, 0.3);
    this.previewGraphics.fillRect(tileX * TILE_SIZE, tileY * TILE_SIZE, pw, ph);
    this.previewGraphics.lineStyle(2, valid ? 0x44ff44 : 0xff4444);
    this.previewGraphics.strokeRect(tileX * TILE_SIZE, tileY * TILE_SIZE, pw, ph);
  }

  private isValidPlacement(tx: number, ty: number, w: number, h: number, zone: string): boolean {
    if (tx < 0 || ty < 0 || tx + w > GRID_W || ty + h > GRID_H) return false;

    // Zone check
    if (zone === 'DataNode') {
      return this.gridRenderer.getZone(tx, ty) === ZoneType.DataNode;
    }
    if (zone === 'SiliconVein') {
      return this.gridRenderer.getZone(tx, ty) === ZoneType.SiliconVein;
    }

    // Collision check
    for (const b of this.state.buildings) {
      if (tx < b.x + b.width && tx + w > b.x && ty < b.y + b.height && ty + h > b.y) {
        return false;
      }
    }
    return true;
  }

  shutdown(): void {
    stopTickLoop();
    this.hud.destroy();
    this.buildPanel.destroy();
    this.overlays.destroy();
    this.marketPanel.destroy();
    this.techPanel.destroy();
    this.infoPanel.destroy();
  }
}
