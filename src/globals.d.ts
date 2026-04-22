// Extend Window to allow dynamic panel callback properties
interface Window {
  __marketToggle: (modelId: string) => void;
  __marketSell: (modelId: string) => void;
  __techUnlock: (nodeId: string) => void;
  __demolish: (id: string) => void;
  __setRecipe: (buildingId: string, recipeId: string) => void;
}
