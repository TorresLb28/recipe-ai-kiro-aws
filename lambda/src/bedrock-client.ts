import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { GenerateRecipeRequest, RecipeResponse } from './types';

/**
 * Constructs the prompt for Bedrock based on ingredients and regeneration flag
 * Includes system instructions and JSON schema per design.md
 */
export function buildPrompt(request: GenerateRecipeRequest): string {
  const regenerateInstruction = request.regenerate 
    ? 'Generate a DIFFERENT recipe than you might have provided before. Be creative and suggest an alternative dish.' 
    : '';
  
  return `You are a helpful recipe assistant. Given the following ingredients, create a complete recipe.

Ingredients available:
${request.ingredients}

${regenerateInstruction}

Respond with a JSON object in this exact format:
{
  "title": "Recipe name (max 100 chars)",
  "description": "Brief description (max 500 chars)",
  "ingredients": [
    {"name": "ingredient 1", "category": "you-have"},
    {"name": "ingredient 2", "category": "you-may-need"}
  ],
  "steps": ["Step 1", "Step 2", ...],
  "cookingTime": 30,
  "servings": 4
}

Rules:
- Use ingredients marked "you-have" when they match the provided list
- Mark additional ingredients as "you-may-need"
- Include 1-30 ingredients
- Include 1-20 steps
- Cooking time: 1-480 minutes
- Servings: 1-20
- Return ONLY the JSON object, no other text`;
}

/**
 * Invokes Bedrock with the constructed prompt using 25-second timeout
 * Model ARN from environment variable BEDROCK_MODEL_ARN
 */
export async function invokeBedrockModel(prompt: string): Promise<string> {
  const client = new BedrockRuntimeClient({ region: 'us-east-1' });
  
  const modelArn = process.env.BEDROCK_MODEL_ARN;
  if (!modelArn) {
    throw new Error('BEDROCK_MODEL_ARN environment variable not set');
  }
  
  const command = new InvokeModelCommand({
    modelId: modelArn,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })
  });
  
  // Race between Bedrock invocation and 25-second timeout
  const response = await Promise.race<any>([
    client.send(command),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Bedrock timeout')), 25000)
    )
  ]);
  
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));
  return responseBody.content[0].text;
}

/**
 * Parses Bedrock response text and extracts JSON
 * Handles both plain JSON and markdown code blocks
 */
export function parseBedrockResponse(response: string): RecipeResponse {
  // Extract JSON from response (may contain markdown code blocks)
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in Bedrock response');
  }
  
  try {
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    throw new Error('Invalid JSON in Bedrock response');
  }
}
