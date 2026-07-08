
export type PromptType = 'system' | 'user' | 'template';

export interface AIPrompt {
  id: string;
  title: string;
  content: string;
  type: PromptType;
  category: string;
  tags: string[];
  isFavorite: boolean;
  isBuiltIn: boolean;
  variables?: string[];
  createdAt: number;
  updatedAt: number;
}

export interface PromptLibraryStats {
  totalPrompts: number;
  favoriteCount: number;
  builtInCount: number;
  categories: string[];
}
