import { GameState } from '../simulation/GameState';
import { BuildingType } from '../entities/Building';
import { getAllBuildingConfigs, BuildingConfig } from '../simulation/techTree';

export type PlacementMode =
  | { active: false }
  | { active: true; buildingType: BuildingType; config: BuildingConfig };

export class BuildPanel {
  private container: HTMLElement;
  private tooltip: HTMLElement;
  private onSelect: (mode: PlacementMode) => void;
  private selectedType: BuildingType | null = null;
  private _persistentChildren: Set<HTMLElement> = new Set();

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

    this.tooltip = document.createElement('div');
    this.tooltip.id = 'building-tooltip';
    this.tooltip.style.cssText = `
      display: none; position: fixed; left: 182px; top: 36px;
      width: 220px; background: rgba(10,10,22,0.97);
      border: 1px solid #334; border-radius: 4px;
      padding: 10px 12px; font-family: monospace; font-size: 11px;
      color: #ccc; z-index: 100; pointer-events: none;
    `;
    document.body.appendChild(this.tooltip);

    this.render(null);
  }

  private renderTooltip(cfg: BuildingConfig): void {
    const row = (label: string, value: string, color = '#aaa') =>
      `<tr>
        <td style="color:#556;padding:2px 6px 2px 0;white-space:nowrap">${label}</td>
        <td style="color:${color};padding:2px 0">${value}</td>
      </tr>`;

    const section = (title: string, rows: string) =>
      `<tr><td colspan="2" style="padding:6px 0 2px;color:#88aaff;font-size:10px;text-transform:uppercase;letter-spacing:1px">${title}</td></tr>${rows}`;

    let consumeRows = '';
    for (const inp of cfg.inputs) {
      consumeRows += row(inp.resource, `${inp.rate} / tick`, '#f8a');
    }
    if (cfg.energyCost > 0) consumeRows += row('Énergie', `${cfg.energyCost} W`, '#f8a');
    if (cfg.vramCost > 0) consumeRows += row('VRAM', `${cfg.vramCost} GB`, '#f8a');
    if (cfg.heatPerTick > 0) consumeRows += row('Chaleur', `+${cfg.heatPerTick} / tick`, '#f8a');

    let produceRows = '';
    for (const out of cfg.outputs) {
      produceRows += row(out.resource, `${out.rate} / tick`, '#8fa');
    }
    if (cfg.energyOutput && cfg.energyOutput > 0) {
      produceRows += row('Énergie', `+${cfg.energyOutput} W`, '#8fa');
    }

    const costRow = row('Construction', `${cfg.buildCost} Credits`, '#fa8');

    this.tooltip.innerHTML = `
      <div style="font-weight:bold;color:#ddd;margin-bottom:6px;font-size:12px">${cfg.label}</div>
      <div style="color:#556;font-size:10px;margin-bottom:4px">${cfg.width}×${cfg.height}</div>
      <table style="border-collapse:collapse;width:100%">
        ${consumeRows ? section('Consomme', consumeRows) : ''}
        ${produceRows ? section('Produit', produceRows) : ''}
        <tr><td colspan="2" style="padding:4px 0 2px;border-top:1px solid #223"></td></tr>
        ${costRow}
      </table>
    `;
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

    // Re-append any persistent child elements (e.g., LogisticsPanel) that survived innerHTML wipe
    for (const el of Array.from(this._persistentChildren)) {
      this.container.appendChild(el);
    }

    // Bind click and hover events
    for (const el of this.container.querySelectorAll('.build-item')) {
      const htmlEl = el as HTMLElement;
      const type = htmlEl.dataset.type as BuildingType;
      const config = configs.find(c => c.type === type);

      htmlEl.addEventListener('click', () => {
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

      htmlEl.addEventListener('mouseenter', () => {
        if (!config) return;
        this.renderTooltip(config);
        const rect = htmlEl.getBoundingClientRect();
        this.tooltip.style.top = `${rect.top}px`;
        this.tooltip.style.display = 'block';
      });

      htmlEl.addEventListener('mouseleave', () => {
        this.tooltip.style.display = 'none';
      });
    }
  }

  deselect(): void {
    this.selectedType = null;
    this.tooltip.style.display = 'none';
    this.render(null);
  }

  /** Register a child element to be re-appended after every render (innerHTML wipe) */
  addPersistentChild(el: HTMLElement): void {
    this._persistentChildren.add(el);
  }

  destroy(): void {
    this.tooltip.remove();
    this.container.remove();
  }
}
