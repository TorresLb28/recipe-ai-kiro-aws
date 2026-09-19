// API client for Recipe AI Generator
// Fulfills REQ-1.1, REQ-1.8, REQ-1.9, REQ-6.6, REQ-8.3, REQ-8.4, REQ-8.5, REQ-8.6

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

interface ErrorResponse {
  error: string;
}

/**
 * Generates a recipe from ingredients using the Recipe AI API
 * Throws Error with user-facing message that matches design.md error handling spec
 * 
 * Error messages (thrown as Error.message, ready for direct display):
 * - HTTP 400: Uses error field from response body
 * - HTTP 429: "You've sent too many requests. Please wait a moment before trying again."
 * - HTTP 500: "Unable to generate recipe. Please try again."
 * - HTTP 503: "Recipe service is temporarily unavailable. Please try again later."
 * - Network/fetch failure: "Cannot connect to recipe service. Please check your internet connection."
 * - Timeout (30s): "Request timed out. Please try again."
 */
export async function generateRecipe(
  request: GenerateRecipeRequest,
  timeout: number = 30000
): Promise<RecipeResponse> {
  const apiEndpoint = import.meta.env.VITE_API_ENDPOINT;
  
  if (!apiEndpoint) {
    throw new Error('API endpoint not configured. Please set VITE_API_ENDPOINT environment variable.');
  }

  // Create AbortController for 30-second timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${apiEndpoint}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    // Handle HTTP error status codes with exact messages from design.md
    if (!response.ok) {
      if (response.status === 400) {
  let errorMessage = 'Invalid ingredient list. Please provide food ingredients.';
  try {
    const errorData: ErrorResponse = await response.json();
    if (errorData.error) {
      errorMessage = errorData.error;
    }
  } catch (parseError) {
    // Keep fallback message if body isn't valid JSON
  }
  throw new Error(errorMessage);
}

      if (response.status === 429) {
        // REQ-6.6: Rate limit message
        throw new Error("You've sent too many requests. Please wait a moment before trying again.");
      }

      if (response.status === 500) {
        // REQ-8.3: Generic 500 error message
        throw new Error('Unable to generate recipe. Please try again.');
      }

      if (response.status === 503) {
        // REQ-8.6: Service unavailable message
        throw new Error('Recipe service is temporarily unavailable. Please try again later.');
      }

      // Other HTTP errors
      throw new Error(`Unexpected error: ${response.status} ${response.statusText}`);
    }

    // Parse successful response
    const recipe: RecipeResponse = await response.json();
    return recipe;

  } catch (error) {
    clearTimeout(timeoutId);

    // Handle AbortController timeout (REQ-8.5, REQ-1.9)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }

    // Handle network errors (REQ-8.4)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Cannot connect to recipe service. Please check your internet connection.');
    }

    // Re-throw if already an Error with a message (from HTTP error handling above)
    if (error instanceof Error) {
      throw error;
    }

    // Fallback for unknown errors
    throw new Error('An unexpected error occurred. Please try again.');
  }
}
