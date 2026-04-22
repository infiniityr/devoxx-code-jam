import { ConveyorDirection } from '../entities/Conveyor';

export type LogisticsItem = 'Splitter' | 'Merger';

export interface SplitterConfig {
  type: 'Splitter';
  outputDirections: ConveyorDirection[];
}

export interface MergerConfig {
  type: 'Merger';
  inputDirections: [ConveyorDirection, ConveyorDirection];
  outputDirection: ConveyorDirection;
}

export type LogisticsPlacementConfig = SplitterConfig | MergerConfig;

export type LogisticsPlacementMode =
  | { active: false }
  | { active: true; config: LogisticsPlacementConfig };

const ITEMS: Array<{
  type: LogisticsItem;
  label: string;
  cost: number;
  description: string;
}> = [
  {
    type: 'Splitter',
    label: 'Splitter',
    cost: 30,
    description: 'Divise un flux en 2 ou 3 sorties configurables. Distribution round-robin.',
  },
  {
    type: 'Merger',
    label: 'Merger',
    cost: 30,
    description: 'Fusionne 2 flux entrants en 1 sortie. Ne fusionne que des ressources du même type.',
  },
];

/** Default directions used when placing from UI (can be reconfigured later) */
function defaultConfig(type: LogisticsItem): LogisticsPlacementConfig {
  if (type === 'Splitter') {
    return {
      type: 'Splitter',
      outputDirections: [ConveyorDirection.Right, ConveyorDirection.Down],
    };
  }
  return {
    type: 'Merger',
    inputDirections: [ConveyorDirection.Left, ConveyorDirection.Up],
    outputDirection: ConveyorDirection.Right,
  };
}

export class LogisticsPanel {
  private container: HTMLElement;
  private tooltip: HTMLElement;
  private onSelect: (mode: LogisticsPlacementMode) => void;
  private selectedType: LogisticsItem | null = null;
  private credits: number = Infinity;

  constructor(onSelect: (mode: LogisticsPlacementMode) => void) {
    this.onSelect = onSelect;

    this.container = document.createElement('div');
    this.container.id = 'logistics-panel';
    this.container.style.cssText = `
      font-family: monospace; font-size: 11px; color: #ccc;
      user-select: none; border-top: 1px solid #223; margin-top: 4px;
    `;

    this.tooltip = document.createElement('div');
    this.tooltip.id = 'logistics-tooltip';
    this.tooltip.style.cssText = `
      display: none; position: fixed; left: 182px;
      width: 220px; background: rgba(10,10,22,0.97);
      border: 1px solid #334; border-radius: 4px;
      padding: 10px 12px; font-family: monospace; font-size: 11px;
      color: #ccc; z-index: 100; pointer-events: none;
    `;
    document.body.appendChild(this.tooltip);

    this.render();
  }

  /** Returns the panel's root element for external attachment */
  getContainer(): HTMLElement {
    return this.container;
  }

  update(credits: number): void {
    if (credits !== this.credits) {
      this.credits = credits;
      this.render();
    }
  }

  private render(): void {
    let html = `<div style="padding:4px 12px; color:#556; font-size:10px; text-transform:uppercase">Logistique</div>`;

    for (const item of ITEMS) {
      const canAfford = this.credits >= item.cost;
      const isSelected = this.selectedType === item.type;
      html += `
        <div class="logistics-item" data-type="${item.type}"
          style="
            padding: 6px 12px; cursor: ${canAfford ? 'pointer' : 'not-allowed'};
            color: ${canAfford ? '#ddd' : '#555'};
            background: ${isSelected ? 'rgba(100,150,255,0.2)' : 'transparent'};
            border-left: 3px solid ${isSelected ? '#88aaff' : 'transparent'};
            transition: background 0.1s;
          ">
          <div style="font-weight:bold">${item.label}</div>
          <div style="color:#888; font-size:10px">💎${item.cost} | 1×1</div>
        </div>`;
    }

    this.container.innerHTML = html;
    this.bindEvents();
  }

  private bindEvents(): void {
    for (const el of this.container.querySelectorAll('.logistics-item')) {
      const htmlEl = el as HTMLElement;
      const type = htmlEl.dataset.type as LogisticsItem;
      const item = ITEMS.find(i => i.type === type);
      if (!item) continue;

      htmlEl.addEventListener('click', () => {
        if (this.credits < item.cost) return;

        if (this.selectedType === type) {
          this.selectedType = null;
          this.onSelect({ active: false });
        } else {
          this.selectedType = type;
          this.onSelect({ active: true, config: defaultConfig(type) });
        }
        this.render();
      });

      htmlEl.addEventListener('mouseenter', () => {
        this.tooltip.innerHTML = `
          <div style="font-weight:bold;color:#ddd;margin-bottom:6px;font-size:12px">${item.label}</div>
          <div style="color:#aaa;font-size:10px;margin-bottom:4px">${item.description}</div>
          <div style="color:#fa8;font-size:10px">💎 ${item.cost} Crédits</div>
        `;
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
    this.render();
  }

  destroy(): void {
    this.tooltip.remove();
    this.container.remove();
  }
}
