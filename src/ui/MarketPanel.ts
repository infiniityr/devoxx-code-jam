import { GameState } from '../simulation/GameState';
import { sellModel } from '../simulation/market';

export class MarketPanel {
  private container: HTMLElement;
  private visible: boolean = false;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'market-panel';
    this.container.style.cssText = `
      position: fixed; top: 36px; right: 0; width: 320px; bottom: 0;
      background: rgba(8,8,20,0.97); border-left: 1px solid #223;
      font-family: monospace; font-size: 11px; color: #ccc;
      z-index: 99; padding: 12px; overflow-y: auto; display: none;
    `;
    document.body.appendChild(this.container);
  }

  toggle(): void {
    this.visible = !this.visible;
    this.container.style.display = this.visible ? 'block' : 'none';
  }

  update(state: GameState): void {
    if (!this.visible) return;
    this.render(state);
  }

  private render(state: GameState): void {
    let html = `<div style="color:#88aaff; font-size:13px; font-weight:bold; margin-bottom:10px; border-bottom:1px solid #223; padding-bottom:6px">📈 Marché libre</div>`;

    for (const [, entry] of state.market) {
      const pct = entry.currentPrice / entry.basePrice;
      const priceColor = pct > 1.2 ? '#44ff88' : pct < 0.8 ? '#ff6644' : '#ffcc44';
      const toggleLabel = entry.autoSell ? '🔵 Auto-vente ON' : '⚫ Auto-vente OFF';

      html += `
        <div style="margin-bottom: 12px; border: 1px solid #223; padding: 8px; border-radius: 4px;">
          <div style="display:flex; justify-content:space-between; margin-bottom:4px">
            <strong style="color:#eee">${entry.modelId.toUpperCase()}</strong>
            <span style="color:${priceColor}">${entry.currentPrice} 💎</span>
          </div>
          <div style="color:#666; font-size:10px; margin-bottom:4px">
            Offre: ${entry.supplyCount} | Demande: ${(entry.demandMultiplier * 100).toFixed(0)}%
          </div>
          <canvas id="chart-${entry.modelId}" width="280" height="60" style="width:100%; height:60px; border:1px solid #223; border-radius:2px; background:#0a0a14; display:block; margin-bottom:6px"></canvas>
          <div style="display:flex; gap:6px">
            <button onclick="window.__marketToggle('${entry.modelId}')"
              style="flex:1; padding:4px; background:#1a1a2e; border:1px solid #334; color:#aaa; cursor:pointer; font-family:monospace; font-size:10px; border-radius:2px">
              ${toggleLabel}
            </button>
            <button onclick="window.__marketSell('${entry.modelId}')"
              style="flex:1; padding:4px; background:#1a2a1a; border:1px solid #364; color:#88ff88; cursor:pointer; font-family:monospace; font-size:10px; border-radius:2px">
              Vendre manuellement
            </button>
          </div>
        </div>`;
    }

    this.container.innerHTML = html;

    // Draw price charts
    for (const [, entry] of state.market) {
      const canvas = document.getElementById(`chart-${entry.modelId}`) as HTMLCanvasElement;
      if (!canvas) continue;
      const ctx = canvas.getContext('2d')!;
      this.drawPriceChart(ctx, canvas.width, canvas.height, entry.priceHistory, entry.currentPrice);
    }

    // Bind global handlers
    window.__marketToggle = (modelId: string) => {
      const entry = state.market.get(modelId);
      if (entry) {
        entry.autoSell = !entry.autoSell;
        this.render(state);
      }
    };

    window.__marketSell = (modelId: string) => {
      sellModel(state, modelId, 75);
      this.render(state);
    };
  }

  private drawPriceChart(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    history: number[],
    current: number
  ): void {
    ctx.clearRect(0, 0, w, h);
    if (history.length < 2) {
      ctx.fillStyle = '#334';
      ctx.font = '10px monospace';
      ctx.fillText('Pas encore de données...', 4, h / 2 + 4);
      return;
    }

    const all = [...history, current];
    const minP = Math.min(...all) * 0.9;
    const maxP = Math.max(...all) * 1.1;
    const range = maxP - minP || 1;

    ctx.strokeStyle = '#44aaff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < all.length; i++) {
      const x = (i / (all.length - 1)) * w;
      const y = h - ((all[i] - minP) / range) * h;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Current price dot
    ctx.fillStyle = '#44aaff';
    ctx.beginPath();
    ctx.arc(w - 2, h - ((current - minP) / range) * h, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  destroy(): void {
    this.container.remove();
  }
}
