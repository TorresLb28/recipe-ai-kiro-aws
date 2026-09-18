// Type definitions for Recipe AI Lambda function

export interface GenerateRecipeRequest {
  ingredients: string;
  regenerate?: boolean;
}

export interface RecipeResponse {
  title: string;
  description: string;
  ingredients: Ingredient[];
  steps: string[];
  cookingTime?: number;
  servings?: number;
}

export interface Ingredient {
  name: string;
  category: 'you-have' | 'you-may-need';
}

export interface ErrorResponse {
  error: string;
}

export class BadRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BadRequestError';
  }
}

export const ValidationRules = {
  INGREDIENTS_MAX_LENGTH: 2000,
  TITLE_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 500,
  MIN_INGREDIENTS: 1,
  MAX_INGREDIENTS: 30,
  MIN_STEPS: 1,
  MAX_STEPS: 20,
  MIN_COOKING_TIME: 1,
  MAX_COOKING_TIME: 480,
  MIN_SERVINGS: 1,
  MAX_SERVINGS: 20
} as const;
