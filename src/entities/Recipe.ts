import { ResourceType } from './Building';

export interface RecipeInput {
  resource: ResourceType;
  amount: number;
}

export interface Recipe {
  id: string;
  label: string;
  inputs: RecipeInput[];
  cycleTicks: number;
  qualityMin: number;
  qualityMax: number;
  latencyMs: number;
  vramRequired: number;
  basePriceMin: number;
  basePriceMax: number;
  tier: 1 | 2;
}
