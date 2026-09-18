# Implementation Plan: Recipe AI Generator

## Overview

This plan implements a serverless recipe generator using AWS CDK, Lambda, API Gateway, and React. The implementation follows a mobile-first, stateless architecture with cost protection via rate limiting. All code is written in TypeScript following the designs in design.md.

## Tasks

- [ ] 1. Create project structure and configuration files
  - Create root `package.json` with CDK dependencies (aws-cdk-lib, constructs, typescript, ts-node, @types/node)
  - Create `lambda/package.json` with runtime dependencies (@aws-sdk/client-bedrock-runtime, @types/aws-lambda)
  - Create `frontend/package.json` with React + Vite dependencies (react, react-dom, vite, @vitejs/plugin-react, typescript, @types/react)
  - Create root `tsconfig.json` with CDK compiler options (target: ES2022, module: commonjs)
  - Create `lambda/tsconfig.json` with Lambda compiler options (target: ES2022, module: commonjs, outDir: dist)
  - Create `frontend/tsconfig.json` with React compiler options (target: ES2020, module: ESNext, jsx: react-jsx)
  - Create `cdk.json` with app entry point "npx ts-node bin/recipe-ai.ts"
  - Create folder structure: bin/, lib/, lambda/, frontend/src/components/, frontend/src/api/, frontend/public/, test/unit/lambda/, test/unit/frontend/, test/cdk/
  - _Fulfills: REQ-9 Infrastructure Deployment (project setup)_

- [ ] 2. Implement CDK stack skeleton
  - Create `lib/recipe-infrastructure-stack.ts` with empty RecipeInfrastructureStack class extending Stack
  - Create `bin/recipe-ai.ts` with CDK app instantiation targeting us-east-1 region
  - Stack should import necessary CDK constructs but not define resources yet
  - _Fulfills: REQ-9.1 (CDK stack structure)_
  - _Files: lib/recipe-infrastructure-stack.ts, bin/recipe-ai.ts_

- [ ] 3. Implement Lambda function code
  - Create `lambda/types.ts` with interfaces: GenerateRecipeRequest, RecipeResponse, Ingredient, BadRequestError class
  - Create `lambda/validation.ts` with functions: validateIngredients (food term regex check per design.md), validateRecipeResponse (check title ≤100 chars, ingredients 1-30, steps 1-20, cookingTime 1-480, servings 1-20, required fields)
  - Create `lambda/bedrock-client.ts` with functions: buildPrompt (with regenerate flag handling), invokeBedrockModel (25s timeout using Promise.race, model ARN from env), parseBedrockResponse (extract JSON from markdown)
  - Create `lambda/index.ts` with handler function implementing: parseRequest, validateIngredients call, generateRecipe orchestration, successResponse, errorResponse (per design.md error handling)
  - _Fulfills: REQ-1.4, REQ-1.5, REQ-1.6, REQ-2.1, REQ-2.2, REQ-2.3, REQ-2.4-9, REQ-2.10-12, REQ-4.4, REQ-7.1-5, REQ-8.1-2_
  - _Files: lambda/types.ts, lambda/validation.ts, lambda/bedrock-client.ts, lambda/index.ts_

- [ ] 4. Add Lambda function to CDK stack
  - In `lib/recipe-infrastructure-stack.ts`, create Lambda function construct with: functionName "recipe-ai-service", runtime Node.js 20.x, handler "index.handler", code from lambda/ directory, timeout 30s, memory 512MB, environment variable BEDROCK_MODEL_ARN set to exact ARN from design.md
  - Add IAM policy to Lambda execution role: allow bedrock:InvokeModel on specific model ARN from design.md
  - Add IAM policy for CloudWatch Logs: allow CreateLogGroup, CreateLogStream, PutLogEvents on log-group:/aws/lambda/recipe-ai-*
  - _Fulfills: REQ-9.3, REQ-9.4, REQ-9.5, REQ-9.6_
  - _Files: lib/recipe-infrastructure-stack.ts_

- [ ] 5. Add S3 bucket and CloudFront distribution to CDK stack
  - In `lib/recipe-infrastructure-stack.ts`, create S3 bucket with: bucketName "recipe-ai-frontend-${this.account}", blockPublicAccess BLOCK_ALL, encryption S3_MANAGED, removalPolicy DESTROY, autoDeleteObjects true
  - Create S3OriginAccessControl with signing SIGV4_ALWAYS
  - Create CloudFront distribution with: S3BucketOrigin using OAC, viewerProtocolPolicy REDIRECT_TO_HTTPS, cachePolicy CACHING_OPTIMIZED, defaultRootObject "index.html", errorResponses for 404→200 redirect to /index.html
  - Add S3 bucket policy allowing cloudfront.amazonaws.com principal to s3:GetObject with condition on distribution ARN
  - _Fulfills: REQ-9.7, REQ-9.8_
  - _Files: lib/recipe-infrastructure-stack.ts_

- [ ] 6. Add HTTP API Gateway to CDK stack
  - In `lib/recipe-infrastructure-stack.ts`, create HttpApi with: apiName "recipe-ai-api", corsPreflight allowing origin https://${distribution.distributionDomainName} with methods POST and OPTIONS, headers Content-Type, maxAge 300s
  - Configure default stage with throttle: rateLimit 3, burstLimit 10
  - Add route: POST /generate with HttpLambdaIntegration to Lambda function
  - _Fulfills: REQ-9.1, REQ-9.2, REQ-9.9, REQ-9.10, REQ-9.13, REQ-6.1, REQ-6.2, REQ-6.3, REQ-6.4, REQ-6.5_
  - _Files: lib/recipe-infrastructure-stack.ts_

- [ ] 7. Add CDK stack outputs
  - In `lib/recipe-infrastructure-stack.ts`, create CfnOutput for ApiEndpoint with value api.apiEndpoint, description "Recipe API endpoint URL"
  - Create CfnOutput for CloudFrontUrl with value https://${distribution.distributionDomainName}, description "CloudFront distribution URL for frontend"
  - _Fulfills: REQ-9 (deployment visibility)_
  - _Files: lib/recipe-infrastructure-stack.ts_

- [ ] 8. Create frontend project structure
  - Create `frontend/vite.config.ts` with React plugin configuration and build output to dist/
  - Create `frontend/public/index.html` with meta viewport for mobile, title "Recipe AI Generator", div id="root"
  - Create `frontend/src/App.tsx` stub with AppState interface (ingredientInput: string, recipe: RecipeResponse | null, isLoading: boolean, error: string | null) and empty render
  - Create `frontend/src/styles/App.css` with mobile-first responsive breakpoints (375-430px, 431-768px, 769px+), minimum font-size 16px, minimum touch target 44px×44px, 8px spacing
  - _Fulfills: REQ-5.1, REQ-5.2, REQ-5.3, REQ-5.4, REQ-5.5, REQ-5.6_
  - _Files: frontend/vite.config.ts, frontend/public/index.html, frontend/src/App.tsx, frontend/src/styles/App.css_

- [ ] 9. Implement frontend API client
  - Create `frontend/src/api/apiClient.ts` with interfaces matching lambda/types.ts exactly: GenerateRecipeRequest, RecipeResponse, Ingredient
  - Implement generateRecipe async function: POST to API endpoint from env variable VITE_API_ENDPOINT, timeout 30s using AbortController, headers Content-Type: application/json
  - Handle HTTP status codes: 400 (return error.message), 429 (map to user-friendly message per REQ-6.6), 500 (map to generic message per REQ-8.3), 503 (map to unavailable message per REQ-8.6), network errors (map per REQ-8.4), timeout (map per REQ-8.5)
  - _Fulfills: REQ-1.1, REQ-1.8, REQ-1.9, REQ-6.6, REQ-8.3, REQ-8.4, REQ-8.5, REQ-8.6_
  - _Files: frontend/src/api/apiClient.ts_

- [ ] 10. Implement frontend components
  - Create `frontend/src/components/IngredientInput.tsx` with textarea, character counter, max 2000 chars, validation for empty/whitespace-only input, disabled state during loading
  - Create `frontend/src/components/RecipeDisplay.tsx` rendering: title, description, ingredients grouped by category (you-have vs you-may-need with visual distinction per REQ-3.3), steps in numbered list starting from 1, cookingTime formatted (minutes if <60, hours+minutes if ≥60), servings
  - Create `frontend/src/components/ErrorDisplay.tsx` with error message display, dismiss button, auto-dismiss after 10s for non-critical errors
  - Create `frontend/src/components/LoadingSpinner.tsx` with visual loading indicator and ARIA label
  - Create `frontend/src/components/RegenerateButton.tsx` with button, disabled state during loading
  - _Fulfills: REQ-1.2, REQ-1.3, REQ-3.1, REQ-3.2, REQ-3.3, REQ-3.4, REQ-3.5, REQ-3.6, REQ-3.7, REQ-3.8, REQ-3.9, REQ-4.1, REQ-4.2_
  - _Files: frontend/src/components/IngredientInput.tsx, frontend/src/components/RecipeDisplay.tsx, frontend/src/components/ErrorDisplay.tsx, frontend/src/components/LoadingSpinner.tsx, frontend/src/components/RegenerateButton.tsx_

- [ ] 11. Wire frontend components in App.tsx
  - In `frontend/src/App.tsx`, implement state management with useState for AppState interface
  - Implement handleSubmit function: validate input (1-2000 chars, non-empty after trim), set isLoading true, call apiClient.generateRecipe, handle success (set recipe, clear error) and errors (set error message, clear recipe), set isLoading false
  - Implement handleRegenerate function: call apiClient.generateRecipe with regenerate: true flag, same state handling as handleSubmit
  - Render components conditionally: IngredientInput (always), LoadingSpinner (when isLoading), ErrorDisplay (when error), RecipeDisplay (when recipe), RegenerateButton (when recipe and not isLoading)
  - _Fulfills: REQ-4.3, REQ-4.5, REQ-4.6, REQ-4.7_
  - _Files: frontend/src/App.tsx_

- [ ] 12. Write unit tests for Lambda functions
  - Create `test/unit/lambda/validation.test.ts` with test cases: validateIngredients accepts food terms (case-insensitive), rejects non-food input; validateRecipeResponse checks title ≤100 chars, ingredients 1-30 with valid categories, steps 1-20, cookingTime 1-480, servings 1-20, required fields presence
  - Create `test/unit/lambda/bedrock-client.test.ts` with test cases: parseBedrockResponse extracts JSON from plain text, extracts JSON from markdown code block, throws on no JSON; buildPrompt includes regenerate instruction when flag true, omits when flag false
  - Use Jest as test framework with ts-jest preset
  - _Fulfills: Testing Strategy from design.md (Backend Unit Tests section)_
  - _Files: test/unit/lambda/validation.test.ts, test/unit/lambda/bedrock-client.test.ts_

- [ ] 13. Write CDK infrastructure tests
  - Create `test/cdk/infrastructure.test.ts` using CDK assertions Template.fromStack
  - Test cases: Lambda has runtime nodejs20.x, memory 512, timeout 30; IAM policy allows bedrock:InvokeModel on specific ARN; S3 bucket blocks public access; API Gateway stage has throttling rateLimit 3, burstLimit 10; API has CORS with POST and OPTIONS methods; CloudFront distribution exists
  - _Fulfills: Testing Strategy from design.md (CDK Infrastructure Testing section)_
  - _Files: test/cdk/infrastructure.test.ts_

- [ ] 14. Checkpoint - Verify implementation completeness
  - Ensure all tests pass by running `npm test` in root, lambda/, and frontend/ directories
  - Verify all acceptance criteria from requirements.md are covered by tasks 1-13
  - Ask the user if questions arise or if any requirement coverage is unclear

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Implementation uses TypeScript throughout (CDK, Lambda, Frontend)
- No deployment tasks included (out of scope per design.md Future Enhancements)
- No integration tests or manual testing included (requires deployed AWS infrastructure)
- All field names, types, and validation rules match exactly with requirements.md and design.md
- Rate limiting is implemented at API Gateway stage level per REQ-6.1

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1", "2"] },
    { "id": 1, "tasks": ["3", "8"] },
    { "id": 2, "tasks": ["4", "9"] },
    { "id": 3, "tasks": ["5", "10"] },
    { "id": 4, "tasks": ["6", "11"] },
    { "id": 5, "tasks": ["7", "12", "13"] },
    { "id": 6, "tasks": ["14"] }
  ]
}
```
