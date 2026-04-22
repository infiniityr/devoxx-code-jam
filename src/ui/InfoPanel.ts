import { Building } from '../entities/Building';
import { GameState } from '../simulation/GameState';
import { removeBuilding, setIntegratorRecipe } from '../simulation/world';
import { BuildingType } from '../entities/Building';
import recipesJson from '../data/recipes.json';
import { Recipe } from '../entities/Recipe';

const recipes: Recipe[] = recipesJson as Recipe[];

export class InfoPanel {
  private container: HTMLElement;
  private building: Building | null = null;
  private state: GameState | null = null;
  private onRemove: (id: string) => void;

  constructor(onRemove: (id: string) => void) {
    this.onRemove = onRemove;
    this.container = document.createElement('div');
    this.container.id = 'info-panel';
    this.container.style.cssText = `
      position: fixed; bottom: 0; left: 180px; right: 0; height: 160px;
      background: rgba(8,8,20,0.97); border-top: 1px solid #223;
      font-family: monospace; font-size: 11px; color: #ccc;
      z-index: 99; padding: 10px 16px; display: none;
    `;
    document.body.appendChild(this.container);
  }

  show(building: Building, state: GameState): void {
    this.building = building;
    this.state = state;
    this.container.style.display = 'block';
    this.render();
  }

  hide(): void {
    this.building = null;
    this.container.style.display = 'none';
  }

  update(): void {
    if (this.building && this.state) this.render();
  }

  private render(): void {
    if (!this.building || !this.state) return;
    const b = this.building;
    const buf = this.state.buffers.get(b.id);
    const btnStyle = `padding:4px 10px; background:#1a1a2e; border:1px solid #334; color:#ccc; cursor:pointer; font-family:monospace; font-size:11px; border-radius:2px; margin-right:6px`;

    let html = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start">
        <div>
          <strong style="color:#eee; font-size:12px">${b.type}</strong>
          <span style="color:#556; margin-left:8px">${b.id}</span>
          <span style="color:${b.powered ? '#44ff88' : '#ff4444'}; margin-left:8px">${b.powered ? '● Active' : '● Hors tension'}</span>
          ${b.overheat ? '<span style="color:#ff8800; margin-left:8px">🌡 Surchauffe</span>' : ''}
        </div>
        <div>
          <span style="color:#888">⚡${b.energyCost}W | 🧠${b.vramCost}GB | 🌡${b.localHeat.toFixed(0)}%</span>
        </div>
      </div>
      <div style="display:flex; gap:24px; margin-top:6px">
    `;

    // Input ports
    if (b.inputPorts.length > 0) {
      html += `<div><div style="color:#556; font-size:10px; margin-bottom:3px">INPUTS</div>`;
      for (const port of b.inputPorts) {
        const inBuf = buf?.get(port.resource) ?? 0;
        const satPct = Math.min(100, (port.actualRate / port.ratePerTick) * 100).toFixed(0);
        html += `<div>${port.resource}: ${inBuf.toFixed(0)} | ${satPct}%</div>`;
      }
      html += `</div>`;
    }

    // Output ports
    if (b.outputPorts.length > 0) {
      html += `<div><div style="color:#556; font-size:10px; margin-bottom:3px">OUTPUTS</div>`;
      for (const port of b.outputPorts) {
        const outBuf = buf?.get(port.resource) ?? 0;
        html += `<div>${port.resource}: ${outBuf.toFixed(0)} | rate ${port.actualRate.toFixed(1)}/t</div>`;
      }
      html += `</div>`;
    }

    // Model Integrator recipe selector
    if (b.type === BuildingType.ModelIntegrator) {
      html += `<div><div style="color:#556; font-size:10px; margin-bottom:3px">RECETTE</div>`;
      for (const r of recipes) {
        if (!this.state.unlockedRecipes.has(r.id)) continue;
        const isActive = b.recipeId === r.id;
        html += `<button onclick="window.__setRecipe('${b.id}', '${r.id}')"
          style="${btnStyle}; background: ${isActive ? '#1a2a3a' : '#111'}; color: ${isActive ? '#88ccff' : '#888'}">
          ${isActive ? '▶ ' : ''}${r.label}
        </button>`;
      }
      if (b.cycleTick !== undefined && b.recipeId) {
        const recipe = recipes.find(r => r.id === b.recipeId);
        const progress = recipe ? ((b.cycleTick / recipe.cycleTicks) * 100).toFixed(0) : '0';
        html += `<div style="margin-top:4px; color:#888">Cycle: ${progress}%</div>`;
      }
      html += `</div>`;
    }

    html += `</div>
      <div style="margin-top:8px">
        <button onclick="window.__demolish('${b.id}')" style="${btnStyle}; color:#ff6644; border-color:#443">
          🗑 Démolir (50% remboursé)
        </button>
      </div>`;

    this.container.innerHTML = html;

    window.__demolish = (id: string) => {
      if (this.state) removeBuilding(this.state, id);
      this.hide();
      this.onRemove(id);
    };

    window.__setRecipe = (buildingId: string, recipeId: string) => {
      if (this.state) setIntegratorRecipe(this.state, buildingId, recipeId);
      this.render();
    };
  }

  destroy(): void {
    this.container.remove();
  }
}
