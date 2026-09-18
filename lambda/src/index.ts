import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { BadRequestError, GenerateRecipeRequest, RecipeResponse, ValidationRules } from './types';
import { validateIngredients, validateRecipeResponse } from './validation';
import { buildPrompt, invokeBedrockModel, parseBedrockResponse } from './bedrock-client';

/**
 * Lambda handler for recipe generation
 * Fulfills REQ-1, REQ-2, REQ-4.4, REQ-7, REQ-8
 */
export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  try {
    // Parse and validate request
    const request = parseRequest(event);
    
    // Validate ingredients contain food terms (REQ-1.4, REQ-1.5, REQ-1.6)
    validateIngredients(request.ingredients);
    
    // Generate recipe via Bedrock (REQ-2.1, REQ-2.2, REQ-2.3)
    const recipe = await generateRecipe(request);
    
    // Return success response
    return successResponse(recipe);
    
  } catch (error) {
    // Error handling per REQ-8.1, REQ-8.2
    return errorResponse(error);
  }
}

/**
 * Parses request body and extracts GenerateRecipeRequest
 */
function parseRequest(event: APIGatewayProxyEventV2): GenerateRecipeRequest {
  if (!event.body) {
    throw new BadRequestError('Request body is required');
  }
  
  let parsed: any;
  try {
    parsed = JSON.parse(event.body);
  } catch (error) {
    throw new BadRequestError('Invalid JSON in request body');
  }
  
  if (!parsed.ingredients || typeof parsed.ingredients !== 'string') {
    throw new BadRequestError('Ingredients field is required and must be a string');
  }

  const trimmed = parsed.ingredients.trim();

  if (trimmed.length === 0) {
    throw new BadRequestError('Please provide a list of food ingredients');
  }

  if (trimmed.length > ValidationRules.INGREDIENTS_MAX_LENGTH) {
    throw new BadRequestError('Ingredient list exceeds maximum length');
  }
  
  return {
    ingredients: trimmed,
    regenerate: parsed.regenerate === true
  };
}

/**
 * Orchestrates recipe generation: build prompt, invoke Bedrock, parse and validate response
 */
async function generateRecipe(request: GenerateRecipeRequest): Promise<RecipeResponse> {
  const prompt = buildPrompt(request);
  const bedrockResponse = await invokeBedrockModel(prompt);
  const recipe = parseBedrockResponse(bedrockResponse);
  
  // Validate response structure (REQ-2.4-9, REQ-2.12)
  validateRecipeResponse(recipe);
  
  return recipe;
}

/**
 * Formats successful response with CORS headers
 */
function successResponse(recipe: RecipeResponse): APIGatewayProxyResultV2 {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(recipe)
  };
}

/**
 * Formats error response with appropriate status code and user-friendly message
 * Logs detailed error for debugging (REQ-8.2)
 */
function errorResponse(error: unknown): APIGatewayProxyResultV2 {
  console.error('Error processing request:', {
    errorType: error instanceof Error ? error.name : 'Unknown',
    errorMessage: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined
  });
  
  // Return 400 for validation errors (REQ-1.7)
  if (error instanceof BadRequestError) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message })
    };
  }
  
  // Return generic 500 for all other errors (REQ-8.1)
  return {
    statusCode: 500,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: 'Unable to generate recipe. Please try again.' })
  };
}
