import { GameState } from '../simulation/GameState';
import { BuildingType } from '../entities/Building';
import { getAllBuildingConfigs, BuildingConfig } from '../simulation/techTree';

export type PlacementMode =
  | { active: false }
  | { active: true; buildingType: BuildingType; config: BuildingConfig };

export class BuildPanel {
  private container: HTMLElement;
  private onSelect: (mode: PlacementMode) => void;
  private selectedType: BuildingType | null = null;

  constructor(onSelect: (mode: PlacementMode) => void) {
    this.onSelect = onSelect;
    this.container = document.createElement('div');
    this.container.id = 'build-panel';
    this.container.style.cssText = `
      position: fixed; top: 36px; left: 0; width: 180px; bottom: 0;
      background: rgba(10,10,22,0.96); border-right: 1px solid #223;
      overflow-y: auto; padding: 8px 0;
      font-family: monospace; font-size: 11px; color: #ccc;
      z-index: 99; user-select: none;
    `;
    document.body.appendChild(this.container);
    this.render(null);
  }

  render(state: GameState | null): void {
    const configs = getAllBuildingConfigs();
    const categories = [...new Set(configs.map(c => c.category))];

    const credits = state?.credits ?? Infinity;

    let html = `<div style="padding: 8px 12px; color:#88aaff; font-size:12px; font-weight:bold; border-bottom:1px solid #223">🏗 Bâtiments</div>`;

    for (const cat of categories) {
      html += `<div style="padding:4px 12px; color:#556; font-size:10px; text-transform:uppercase">${cat}</div>`;
      for (const cfg of configs.filter(c => c.category === cat)) {
        const canAfford = credits >= cfg.buildCost;
        const isSelected = this.selectedType === (cfg.type as BuildingType);
        html += `
          <div class="build-item" data-type="${cfg.type}"
            style="
              padding: 6px 12px; cursor: ${canAfford ? 'pointer' : 'not-allowed'};
              color: ${canAfford ? '#ddd' : '#555'};
              background: ${isSelected ? 'rgba(100,150,255,0.2)' : 'transparent'};
              border-left: 3px solid ${isSelected ? '#88aaff' : 'transparent'};
              transition: background 0.1s;
            ">
            <div style="font-weight:bold">${cfg.label}</div>
            <div style="color:#888; font-size:10px">💎${cfg.buildCost} | ⚡${cfg.energyCost}W</div>
            <div style="color:#666; font-size:10px">${cfg.width}×${cfg.height}</div>
          </div>`;
      }
    }

    html += `<div style="padding:8px 12px; margin-top:8px; color:#556; font-size:10px; border-top:1px solid #223">
      <div>C: Conveyor</div>
      <div>R: Rotate</div>
      <div>Échap: Annuler</div>
    </div>`;

    this.container.innerHTML = html;

    // Bind click events
    for (const el of this.container.querySelectorAll('.build-item')) {
      el.addEventListener('click', () => {
        const type = (el as HTMLElement).dataset.type as BuildingType;
        const config = configs.find(c => c.type === type);
        if (!config || (state && state.credits < config.buildCost)) return;

        if (this.selectedType === type) {
          this.selectedType = null;
          this.onSelect({ active: false });
        } else {
          this.selectedType = type;
          this.onSelect({ active: true, buildingType: type, config });
        }
        this.render(state);
      });
    }
  }

  deselect(): void {
    this.selectedType = null;
    this.render(null);
  }

  destroy(): void {
    this.container.remove();
  }
}
