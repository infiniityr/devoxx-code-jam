import { GameState } from '../simulation/GameState';

export class HUD {
  private container: HTMLElement;
  private alertsContainer: HTMLElement;
  private alerts: Array<{ el: HTMLElement; timer: number }> = [];

  constructor() {
    // Create HUD bar
    this.container = document.createElement('div');
    this.container.id = 'hud-bar';
    this.container.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; height: 36px;
      background: rgba(10,10,20,0.92); border-bottom: 1px solid #334;
      display: flex; align-items: center; padding: 0 12px; gap: 20px;
      font-family: monospace; font-size: 12px; color: #ccc;
      z-index: 100; user-select: none;
    `;
    document.body.appendChild(this.container);

    // Alerts container
    this.alertsContainer = document.createElement('div');
    this.alertsContainer.style.cssText = `
      position: fixed; top: 44px; right: 12px;
      display: flex; flex-direction: column; gap: 6px;
      z-index: 101; font-family: monospace; font-size: 11px;
    `;
    document.body.appendChild(this.alertsContainer);
  }

  update(state: GameState): void {
    const energyPct = state.energyCapacity > 0 ? (state.energyUsed / state.energyCapacity * 100).toFixed(0) : '0';
    const energyColor = state.energyUsed > state.energyCapacity * 0.9 ? '#ff6644' : '#44ffcc';
    const vramColor = state.vramUsed > state.vramCapacity * 0.9 ? '#ff6644' : '#aa88ff';

    this.container.innerHTML = `
      <span style="color:${energyColor}">⚡ ${state.energyUsed.toFixed(0)}/${state.energyCapacity}W (${energyPct}%)</span>
      <span style="color:${vramColor}">🧠 ${state.vramUsed.toFixed(1)}/${state.vramCapacity} GB VRAM</span>
      <span style="color:#ff9944">💎 ${state.credits.toFixed(0)} Credits</span>
      <span style="color:#88ccff">📊 ${state.researchPoints} RP</span>
      <span style="color:#44ffcc">⚡ ${state.tokensPerSecond.toFixed(0)} TPS</span>
      <span style="color:#ffcc44">⏱ ${state.avgLatency.toFixed(0)}ms lat.</span>
      <span style="color:#aaaaaa; margin-left: auto">T: Tech Tree | M: Market | 1-4: Overlays | S: Save</span>
    `;

    // Check and emit alerts
    this.checkAlerts(state);
  }

  private checkAlerts(state: GameState): void {
    if (state.energyUsed > state.energyCapacity * 0.93) {
      this.showAlert('⚠️ Blackout imminent — Capacité énergie critique. Ajoutez un Power Generator.');
    }
    if (state.vramUsed > state.vramCapacity * 0.9) {
      this.showAlert('⚠️ VRAM saturée — Model Integrator risque de se bloquer.');
    }
  }

  showAlert(message: string): void {
    // Don't duplicate active alerts
    for (const a of this.alerts) {
      if (a.el.textContent === message) return;
    }

    const el = document.createElement('div');
    el.textContent = message;
    el.style.cssText = `
      background: rgba(20,10,10,0.95); border: 1px solid #ff4400;
      color: #ffaa88; padding: 8px 12px; border-radius: 4px;
      max-width: 360px; line-height: 1.4;
      animation: fadeIn 0.2s ease;
    `;
    this.alertsContainer.appendChild(el);
    const timer = window.setTimeout(() => {
      el.remove();
      this.alerts = this.alerts.filter(a => a.el !== el);
    }, 5000);
    this.alerts.push({ el, timer });
  }

  destroy(): void {
    this.container.remove();
    this.alertsContainer.remove();
  }
}
