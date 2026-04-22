import { GameState } from '../simulation/GameState';
import { canUnlock, unlockTech, getAllTechNodes } from '../simulation/techTree';

export class TechPanel {
  private container: HTMLElement;
  private visible: boolean = false;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'tech-panel';
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
    const nodes = getAllTechNodes();
    const tier1 = nodes.filter(n => n.tier === 1);
    const tier2 = nodes.filter(n => n.tier === 2);
    const tier1UnlockedCount = [...state.unlockedTech].filter(id =>
      tier1.some(n => n.id === id)
    ).length;

    let html = `
      <div style="color:#88aaff; font-size:13px; font-weight:bold; margin-bottom:10px; border-bottom:1px solid #223; padding-bottom:6px">
        🔬 Tech Tree — ${state.researchPoints} RP disponibles
      </div>
    `;

    const renderTier = (tierNodes: typeof nodes, tierLabel: string, locked: boolean) => {
      html += `<div style="color:#556; font-size:10px; text-transform:uppercase; margin:8px 0 4px">${tierLabel}</div>`;
      if (locked) {
        html += `<div style="color:#444; font-style:italic; font-size:10px; padding:4px 8px">🔒 Débloque après 5 nœuds Tier 1 (${tier1UnlockedCount}/5)</div>`;
        return;
      }
      for (const node of tierNodes) {
        const isUnlocked = state.unlockedTech.has(node.id);
        const canBuy = canUnlock(state, node.id);
        const bg = isUnlocked ? '#0a2a0a' : canBuy ? '#0a0a2a' : '#111';
        const color = isUnlocked ? '#44ff88' : canBuy ? '#88aaff' : '#444';
        const btnStyle = `padding:3px 8px; background:#1a1a2e; border:1px solid #334; color:#aaa; cursor:pointer; font-family:monospace; font-size:10px; border-radius:2px`;

        html += `
          <div style="margin-bottom:6px; border:1px solid #223; padding:8px; border-radius:4px; background:${bg}">
            <div style="display:flex; justify-content:space-between; align-items:center">
              <span style="color:${color}; font-weight:bold">${isUnlocked ? '✓ ' : ''}${node.label}</span>
              <span style="color:#888">${node.cost} RP</span>
            </div>
            ${!isUnlocked && canBuy ? `<button onclick="window.__techUnlock('${node.id}')" style="${btnStyle}; margin-top:4px">Débloquer</button>` : ''}
          </div>`;
      }
    };

    renderTier(tier1, 'Tier 1 — Fondations', false);
    renderTier(tier2, 'Tier 2 — Optimisation', tier1UnlockedCount < 5);

    this.container.innerHTML = html;

    window.__techUnlock = (nodeId: string) => {
      unlockTech(state, nodeId);
      this.render(state);
    };
  }

  destroy(): void {
    this.container.remove();
  }
}
