import Phaser from 'phaser';
import { GameState, createInitialState } from '../simulation/GameState';
import { startTickLoop, stopTickLoop } from '../simulation/tick';
import { placeBuilding, placeConveyor, placeSplitter, placeMerger } from '../simulation/world';
import { saveGame, loadGame, applyLoad, maybeAutosave } from '../simulation/save';
import { syncNextId } from '../simulation/world';
import { EventBus, Events } from '../EventBus';
import { Building, BuildingType } from '../entities/Building';
import { ConveyorDirection } from '../entities/Conveyor';
import { Splitter, Merger } from '../entities/Logistics';
import { GridRenderer, TILE_SIZE, GRID_W, GRID_H, ZoneType } from '../rendering/GridRenderer';
import { BuildingSprite } from '../rendering/BuildingSprite';
import { ConveyorAnim } from '../rendering/ConveyorAnim';
import { LogisticsSprite } from '../rendering/LogisticsSprite';
import { HUD } from '../ui/HUD';
import { BuildPanel, PlacementMode } from '../ui/BuildPanel';
import { LogisticsPanel, LogisticsPlacementMode } from '../ui/LogisticsPanel';
import { Overlays } from '../ui/Overlays';
import { MarketPanel } from '../ui/MarketPanel';
import { TechPanel } from '../ui/TechPanel';
import { InfoPanel } from '../ui/InfoPanel';
import { Minimap } from '../ui/Minimap';

export class GameScene extends Phaser.Scene {
  private state!: GameState;
  private gridRenderer!: GridRenderer;
  private buildingSprites: Map<string, BuildingSprite> = new Map();
  private conveyorAnims: Map<string, ConveyorAnim> = new Map();
  private logisticsSprites: Map<string, LogisticsSprite> = new Map();
  private hud!: HUD;
  private buildPanel!: BuildPanel;
  private logisticsPanel!: LogisticsPanel;
  private overlays!: Overlays;
  private marketPanel!: MarketPanel;
  private techPanel!: TechPanel;
  private infoPanel!: InfoPanel;
  private minimap!: Minimap;

  private placementMode: PlacementMode = { active: false };
  private logisticsMode: LogisticsPlacementMode = { active: false };
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
    if (saved) {
      applyLoad(this.state, saved);
      syncNextId(this.state.buildings);
    }

    // Grid
    this.gridRenderer = new GridRenderer(this, this.state.seed);

    // Preview graphics
    this.previewGraphics = this.add.graphics().setDepth(10);

    // UI
    this.hud = new HUD();
    this.buildPanel = new BuildPanel((mode) => {
      this.placementMode = mode;
      this.logisticsMode = { active: false };
      this.conveyorMode = false;
      this.logisticsPanel.deselect();
    });

    this.logisticsPanel = new LogisticsPanel((mode) => {
      this.logisticsMode = mode;
      this.placementMode = { active: false };
      this.conveyorMode = false;
      this.buildPanel.deselect();
    });
    // Register logistics panel container so it survives BuildPanel's innerHTML re-renders
    this.buildPanel.addPersistentChild(this.logisticsPanel.getContainer());
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
    for (const s of this.state.splitters) {
      this.spawnLogisticsSprite(s);
    }
    for (const m of this.state.mergers) {
      this.spawnLogisticsSprite(m);
    }

    // Camera setup
    const worldW = GRID_W * TILE_SIZE;
    const worldH = GRID_H * TILE_SIZE;
    this.cameras.main.setBounds(0, 0, worldW, worldH);
    this.cameras.main.setZoom(0.25);
    this.cameras.main.centerOn(worldW / 2, worldH / 2);

    // Minimap
    this.minimap = new Minimap(this, this.gridRenderer.zones);

    // Input
    this.setupInput();

    // EventBus
    EventBus.on(Events.TICK, () => this.onTick());
    EventBus.on(Events.MODEL_SOLD, (data: unknown) => {
      const { modelId, price } = data as { modelId: string; price: number };
      this.hud.showAlert(`✅ Modèle ${modelId.toUpperCase()} vendu — ${price} 💎`);
    });
    EventBus.on(Events.BUILDING_PLACED, (b: unknown) => {
      const entity = b as Building | Splitter | Merger;
      if ('type' in entity && typeof (entity as Building).type === 'string' &&
          Object.values(BuildingType).includes((entity as Building).type as BuildingType)) {
        this.spawnBuildingSprite(entity as Building);
      } else if ('outputDirections' in entity || 'inputDirections' in entity) {
        this.spawnLogisticsSprite(entity as Splitter | Merger);
      }
    });

    startTickLoop(this.state);
  }

  private onTick(): void {
    // Update all sprites
    for (const [, sprite] of this.buildingSprites) sprite.update();
    for (const [, anim] of this.conveyorAnims) anim.update();
    for (const [, ls] of this.logisticsSprites) ls.update();
    this.hud.update(this.state);
    this.buildPanel.render(this.state);
    this.logisticsPanel.update(this.state.credits);
    this.overlays.update(this.state);
    this.overlays.drawHeatGrid(this.state, this.cameras.main);
    this.marketPanel.update(this.state);
    this.techPanel.update(this.state);
    this.infoPanel.update();
    this.minimap.update(this.state, this.cameras.main);
    maybeAutosave(this.state);
  }

  private spawnBuildingSprite(b: Building): void {
    const sprite = new BuildingSprite(this, b);
    sprite.setInteractive((building) => {
      if (this.placementMode.active || this.conveyorMode || this.logisticsMode.active) return;
      this.infoPanel.show(building, this.state);
    });
    this.buildingSprites.set(b.id, sprite);
  }

  private spawnLogisticsSprite(entity: Splitter | Merger): void {
    const sprite = new LogisticsSprite(this, entity);
    this.logisticsSprites.set(entity.id, sprite);
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
        this.logisticsMode = { active: false };
        this.conveyorMode = false;
        this.buildPanel.deselect();
        this.logisticsPanel.deselect();
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
      this.logisticsMode = { active: false };
      this.conveyorMode = false;
      this.buildPanel.deselect();
      this.logisticsPanel.deselect();
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
      this.logisticsMode = { active: false };
      this.buildPanel.deselect();
      this.logisticsPanel.deselect();
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

    // ZQSD pan
    this.input.keyboard!.addKeys('Z,Q,S,D');
  }

  update(): void {
    const cam = this.cameras.main;
    const speed = 4 / cam.zoom;
    const keys = this.input.keyboard!;

    if (keys.addKey('Z').isDown) cam.scrollY -= speed;
    if (keys.addKey('S').isDown) cam.scrollY += speed;
    if (keys.addKey('Q').isDown) cam.scrollX -= speed;
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

    if (this.logisticsMode.active) {
      const { config } = this.logisticsMode;
      if (config.type === 'Splitter') {
        const splitter = placeSplitter(this.state, tileX, tileY, config.outputDirections);
        if (!splitter) {
          if (this.state.credits < 30) {
            this.hud.showAlert('⚠️ Crédits insuffisants — besoin de 30 💎');
          } else {
            this.hud.showAlert('⚠️ Emplacement occupé');
          }
        }
      } else {
        const merger = placeMerger(this.state, tileX, tileY, config.inputDirections, config.outputDirection);
        if (!merger) {
          if (this.state.credits < 30) {
            this.hud.showAlert('⚠️ Crédits insuffisants — besoin de 30 💎');
          } else {
            this.hud.showAlert('⚠️ Emplacement occupé');
          }
        }
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
      void arrow[arrowIdx];
      return;
    }

    if (this.logisticsMode.active) {
      const valid = this.isCellFreeForLogistics(tileX, tileY);
      const color = this.logisticsMode.config.type === 'Splitter' ? 0x00ccff : 0xaa44ff;
      this.previewGraphics.fillStyle(valid ? color : 0xff4444, 0.4);
      this.previewGraphics.fillRect(tileX * TILE_SIZE, tileY * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      this.previewGraphics.lineStyle(2, valid ? color : 0xff4444);
      this.previewGraphics.strokeRect(tileX * TILE_SIZE, tileY * TILE_SIZE, TILE_SIZE, TILE_SIZE);
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

  private isCellFreeForLogistics(tx: number, ty: number): boolean {
    if (tx < 0 || ty < 0 || tx >= GRID_W || ty >= GRID_H) return false;
    for (const b of this.state.buildings) {
      if (tx >= b.x && tx < b.x + b.width && ty >= b.y && ty < b.y + b.height) return false;
    }
    if (this.state.conveyors.find(c => c.x === tx && c.y === ty)) return false;
    if (this.state.splitters.find(s => s.x === tx && s.y === ty)) return false;
    if (this.state.mergers.find(m => m.x === tx && m.y === ty)) return false;
    return true;
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

    // Collision check with buildings
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
    this.logisticsPanel.destroy();
    this.overlays.destroy();
    this.marketPanel.destroy();
    this.techPanel.destroy();
    this.infoPanel.destroy();
    this.minimap.destroy();
  }
}
