import Phaser from 'phaser';
import { GameState } from '../simulation/GameState';
import { ZoneGrid, ZoneType, GRID_W, GRID_H, TILE_SIZE } from '../rendering/GridRenderer';

const MINIMAP_SIZE = 160;
const MINIMAP_PADDING = 12;

export class Minimap {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private zoneCanvas: HTMLCanvasElement;

  /** Scale factor: minimap pixels per world tile */
  private readonly scaleX = MINIMAP_SIZE / GRID_W;
  private readonly scaleY = MINIMAP_SIZE / GRID_H;

  constructor(scene: Phaser.Scene, zones: ZoneGrid) {
    // Main canvas element — fixed bottom-right
    this.canvas = document.createElement('canvas');
    this.canvas.width = MINIMAP_SIZE;
    this.canvas.height = MINIMAP_SIZE;
    this.canvas.style.cssText = `
      position: fixed;
      bottom: ${MINIMAP_PADDING}px;
      right: ${MINIMAP_PADDING}px;
      width: ${MINIMAP_SIZE}px;
      height: ${MINIMAP_SIZE}px;
      border: 1px solid #446;
      background: rgba(0,0,0,0.75);
      z-index: 100;
      cursor: crosshair;
      image-rendering: pixelated;
    `;
    document.body.appendChild(this.canvas);

    this.ctx = this.canvas.getContext('2d')!;

    // Pre-render zones into an offscreen canvas (drawn once, never redrawn)
    this.zoneCanvas = document.createElement('canvas');
    this.zoneCanvas.width = MINIMAP_SIZE;
    this.zoneCanvas.height = MINIMAP_SIZE;
    this.drawZones(zones);

    // Click-to-navigate
    this.canvas.addEventListener('click', (e) => this.onCanvasClick(e, scene));
  }

  private drawZones(zones: ZoneGrid): void {
    const ctx = this.zoneCanvas.getContext('2d')!;

    for (let y = 0; y < GRID_H; y++) {
      for (let x = 0; x < GRID_W; x++) {
        const zone = zones[y][x];
        if (zone === ZoneType.DataNode) {
          ctx.fillStyle = 'rgba(0, 170, 221, 0.9)';
          ctx.fillRect(
            Math.floor(x * this.scaleX),
            Math.floor(y * this.scaleY),
            Math.max(1, Math.ceil(this.scaleX)),
            Math.max(1, Math.ceil(this.scaleY))
          );
        } else if (zone === ZoneType.SiliconVein) {
          ctx.fillStyle = 'rgba(139, 105, 20, 0.9)';
          ctx.fillRect(
            Math.floor(x * this.scaleX),
            Math.floor(y * this.scaleY),
            Math.max(1, Math.ceil(this.scaleX)),
            Math.max(1, Math.ceil(this.scaleY))
          );
        }
      }
    }
  }

  update(state: GameState, camera: Phaser.Cameras.Scene2D.Camera): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);

    // Zone background
    ctx.drawImage(this.zoneCanvas, 0, 0);

    // Buildings as yellow dots
    ctx.fillStyle = '#ffdd44';
    for (const b of state.buildings) {
      const mx = b.x * this.scaleX;
      const my = b.y * this.scaleY;
      const mw = Math.max(2, b.width * this.scaleX);
      const mh = Math.max(2, b.height * this.scaleY);
      ctx.fillRect(Math.floor(mx), Math.floor(my), Math.ceil(mw), Math.ceil(mh));
    }

    // Camera frustum rectangle
    const worldW = GRID_W * TILE_SIZE;
    const worldH = GRID_H * TILE_SIZE;
    const fx = (camera.scrollX / worldW) * MINIMAP_SIZE;
    const fy = (camera.scrollY / worldH) * MINIMAP_SIZE;
    const fw = ((camera.width / camera.zoom) / worldW) * MINIMAP_SIZE;
    const fh = ((camera.height / camera.zoom) / worldH) * MINIMAP_SIZE;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 1;
    ctx.strokeRect(
      Math.max(0, fx),
      Math.max(0, fy),
      Math.min(MINIMAP_SIZE - Math.max(0, fx), fw),
      Math.min(MINIMAP_SIZE - Math.max(0, fy), fh)
    );
  }

  private onCanvasClick(e: MouseEvent, scene: Phaser.Scene): void {
    const rect = this.canvas.getBoundingClientRect();
    const localX = e.clientX - rect.left;
    const localY = e.clientY - rect.top;
    const worldX = (localX / MINIMAP_SIZE) * GRID_W * TILE_SIZE;
    const worldY = (localY / MINIMAP_SIZE) * GRID_H * TILE_SIZE;
    scene.cameras.main.centerOn(worldX, worldY);
  }

  destroy(): void {
    this.canvas.remove();
  }
}


