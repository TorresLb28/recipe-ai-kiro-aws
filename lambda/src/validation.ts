import { BadRequestError, RecipeResponse, ValidationRules } from './types';

/**
 * Validates that the ingredient list contains at least one recognized food term
 * Uses case-insensitive regex matching against common food keywords
 */
export function validateIngredients(ingredients: string): void {
  const foodTerms = /\b(meat|fish|chicken|beef|pork|rice|pasta|vegetable|fruit|egg|milk|cheese|butter|oil|flour|sugar|salt|pepper|onion|garlic|tomato|potato|carrot|broccoli|spinach|salmon|tuna|shrimp|tofu|bread|noodle|quinoa|spice|sauce)\b/i;
  
  if (!foodTerms.test(ingredients)) {
    throw new BadRequestError('Please provide a list of food ingredients');
  }
}

/**
 * Validates that a recipe response from Bedrock meets all structural requirements
 * Checks required fields, data types, and constraint boundaries per REQ-2.4-9
 */
export function validateRecipeResponse(recipe: any): void {
  // Validate title (required, string, max 100 chars)
  if (!recipe.title || typeof recipe.title !== 'string' || recipe.title.length > ValidationRules.TITLE_MAX_LENGTH) {
    throw new Error('Invalid or missing title');
  }
  
  // Validate description (optional, but if present must be string max 500 chars)
  if (recipe.description && (typeof recipe.description !== 'string' || recipe.description.length > ValidationRules.DESCRIPTION_MAX_LENGTH)) {
    throw new Error('Invalid description');
  }
  
  // Validate ingredients array (required, 1-30 items)
  if (!recipe.ingredients || !Array.isArray(recipe.ingredients) || 
      recipe.ingredients.length < ValidationRules.MIN_INGREDIENTS || 
      recipe.ingredients.length > ValidationRules.MAX_INGREDIENTS) {
    throw new Error('Invalid ingredients array');
  }
  
  // Validate each ingredient has name and valid category
  for (const ing of recipe.ingredients) {
    if (!ing.name || typeof ing.name !== 'string') {
      throw new Error('Invalid ingredient name');
    }
    if (!['you-have', 'you-may-need'].includes(ing.category)) {
      throw new Error('Invalid ingredient category');
    }
  }
  
  // Validate steps array (required, 1-20 items)
  if (!recipe.steps || !Array.isArray(recipe.steps) || 
      recipe.steps.length < ValidationRules.MIN_STEPS || 
      recipe.steps.length > ValidationRules.MAX_STEPS) {
    throw new Error('Invalid steps array');
  }
  
  // Validate each step is a non-empty string
  for (const step of recipe.steps) {
    if (typeof step !== 'string' || step.trim().length === 0) {
      throw new Error('Invalid step content');
    }
  }
  
  // Validate optional cookingTime field (if present, 1-480 minutes)
  if (recipe.cookingTime !== undefined) {
    if (typeof recipe.cookingTime !== 'number' || 
        recipe.cookingTime < ValidationRules.MIN_COOKING_TIME || 
        recipe.cookingTime > ValidationRules.MAX_COOKING_TIME) {
      throw new Error('Invalid cookingTime');
    }
  }
  
  // Validate optional servings field (if present, 1-20)
  if (recipe.servings !== undefined) {
    if (typeof recipe.servings !== 'number' || 
        recipe.servings < ValidationRules.MIN_SERVINGS || 
        recipe.servings > ValidationRules.MAX_SERVINGS) {
      throw new Error('Invalid servings');
    }
  }
}
