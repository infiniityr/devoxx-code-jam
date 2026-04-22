export enum ResourceType {
  DataShard = 'DataShard',
  Silicon = 'Silicon',
  Token = 'Token',
  Neuron = 'Neuron',
  Embedding = 'Embedding',
  AttentionWeight = 'AttentionWeight',
  GradientPacket = 'GradientPacket',
}

export enum BuildingType {
  DataExtractor = 'DataExtractor',
  SiliconMine = 'SiliconMine',
  Tokenizer = 'Tokenizer',
  NeuronFab = 'NeuronFab',
  EmbeddingEncoder = 'EmbeddingEncoder',
  AttentionForge = 'AttentionForge',
  ModelIntegrator = 'ModelIntegrator',
  PowerGenerator = 'PowerGenerator',
}

export enum PlacementZone {
  DataNode = 'DataNode',
  SiliconVein = 'SiliconVein',
  Open = 'Open',
}

export interface IPort {
  resource: ResourceType;
  ratePerTick: number;
  /** actual rate last tick (for saturation display) */
  actualRate: number;
}

export interface IBuilding {
  id: string;
  type: BuildingType;
  x: number;
  y: number;
  width: number;
  height: number;
  active: boolean;
  powered: boolean;
  overheat: boolean;
  inputPorts: IPort[];
  outputPorts: IPort[];
  energyCost: number;
  vramCost: number;
  heatPerTick: number;
  /** heat accumulated locally (0–100) */
  localHeat: number;
  /** only for ModelIntegrator */
  recipeId?: string;
  /** tick counter for model production cycle */
  cycleTick?: number;
  /** input buffer accumulated this cycle */
  cycleBuffer?: Partial<Record<ResourceType, number>>;
}

export class Building implements IBuilding {
  id: string;
  type: BuildingType;
  x: number;
  y: number;
  width: number;
  height: number;
  active: boolean = true;
  powered: boolean = true;
  overheat: boolean = false;
  inputPorts: IPort[];
  outputPorts: IPort[];
  energyCost: number;
  vramCost: number;
  heatPerTick: number;
  localHeat: number = 0;
  recipeId?: string;
  cycleTick?: number;
  cycleBuffer?: Partial<Record<ResourceType, number>>;

  constructor(params: {
    id: string;
    type: BuildingType;
    x: number;
    y: number;
    width: number;
    height: number;
    energyCost: number;
    vramCost: number;
    heatPerTick: number;
    inputPorts: IPort[];
    outputPorts: IPort[];
    recipeId?: string;
  }) {
    this.id = params.id;
    this.type = params.type;
    this.x = params.x;
    this.y = params.y;
    this.width = params.width;
    this.height = params.height;
    this.energyCost = params.energyCost;
    this.vramCost = params.vramCost;
    this.heatPerTick = params.heatPerTick;
    this.inputPorts = params.inputPorts;
    this.outputPorts = params.outputPorts;
    this.recipeId = params.recipeId;
    if (params.type === BuildingType.ModelIntegrator) {
      this.cycleTick = 0;
      this.cycleBuffer = {};
    }
  }
}
