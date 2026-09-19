# Requirements Document

## Introduction

Recipe AI Generator is a web application that generates personalized recipes from user-provided ingredient lists using Amazon Bedrock (Claude Haiku 4.5). The system accepts free-text ingredient input, validates it, and returns complete recipe information including title, description, ingredient categorization, cooking steps, time estimates, and servings. The application is stateless, publicly accessible, and designed for mobile-first interaction.

## Glossary

- **Recipe_Generator_UI**: The React-based frontend application that provides the user interface for ingredient input and recipe display
- **Recipe_API**: The AWS API Gateway HTTP API endpoint that receives recipe generation requests
- **Recipe_Service**: The AWS Lambda function that processes ingredient lists and orchestrates recipe generation
- **Bedrock_Client**: The component that interfaces with Amazon Bedrock Claude Haiku 4.5 model
- **Ingredient_List**: A free-text string provided by the user containing available ingredients
- **Recipe_Response**: The structured recipe output including title, description, categorized ingredients, steps, time, and servings
- **Valid_Ingredient_List**: An Ingredient_List that contains recognizable food items or ingredients
- **Invalid_Ingredient_List**: An Ingredient_List that does not contain recognizable food items or ingredients
- **Throttle_Limiter**: The API Gateway rate limiting mechanism that restricts request frequency

## Requirements

### Requirement 1: Ingredient Input and Validation

**User Story:** As a user, I want to input my available ingredients as free text, so that I can quickly describe what I have without strict formatting requirements

#### Acceptance Criteria

1. WHEN the user submits an Ingredient_List, THE Recipe_Generator_UI SHALL send the input to the Recipe_API
2. WHEN the user submits an Ingredient_List exceeding 2000 characters, THE Recipe_Generator_UI SHALL display an error message and prevent submission
3. WHEN the Recipe_Generator_UI submits an empty Ingredient_List, THE Recipe_Generator_UI SHALL display an error message and prevent submission
4. WHEN the Recipe_Service receives an Ingredient_List, THE Recipe_Service SHALL validate whether the text contains at least one recognized food item term
5. IF the Ingredient_List contains at least one recognized food item term, THEN THE Recipe_Service SHALL classify it as a Valid_Ingredient_List and proceed to recipe generation
6. IF the Ingredient_List contains no recognized food item terms, THEN THE Recipe_Service SHALL classify it as an Invalid_Ingredient_List and return an error message
7. WHEN the Recipe_Service returns an error message for an Invalid_Ingredient_List, THE error message SHALL instruct the user to provide a list of food ingredients
8. WHEN the Recipe_Generator_UI receives an error message, THE Recipe_Generator_UI SHALL display the error message to the user
9. WHEN the Recipe_API does not respond within 30 seconds, THE Recipe_Generator_UI SHALL display a timeout error message

### Requirement 2: Recipe Generation via Bedrock

**User Story:** As a user, I want the system to generate a complete recipe from my ingredients, so that I can cook a meal with what I have

#### Acceptance Criteria

1. WHEN the Recipe_Service processes a Valid_Ingredient_List, THE Recipe_Service SHALL invoke the Bedrock_Client with the ingredient list
2. WHEN the Bedrock_Client is invoked, THE Bedrock_Client SHALL call Amazon Bedrock using model ARN arn:aws:bedrock:us-east-1:986119050917:inference-profile/global.anthropic.claude-haiku-4-5-20251001-v1:0 with a timeout of 25 seconds
3. WHEN Bedrock returns a recipe, THE Recipe_Service SHALL parse the response into a Recipe_Response
4. THE Recipe_Response SHALL contain a recipe title with a maximum length of 100 characters
5. THE Recipe_Response SHALL contain a recipe description with a maximum length of 500 characters
6. THE Recipe_Response SHALL contain a list of 1 to 30 ingredients where each ingredient is marked as either you-have or you-may-need
7. THE Recipe_Response SHALL contain 1 to 20 ordered cooking steps
8. THE Recipe_Response SHALL contain an estimated cooking time expressed as a positive integer number of minutes with a maximum value of 480
9. THE Recipe_Response SHALL contain a servings count expressed as a positive integer with a maximum value of 20
10. IF the Bedrock_Client invocation fails, THEN THE Recipe_Service SHALL return an HTTP 500 status code with an error message
11. IF the Bedrock response cannot be parsed into a valid Recipe_Response structure, THEN THE Recipe_Service SHALL return an HTTP 500 status code with an error message
12. IF the parsed Recipe_Response is missing required fields title, ingredients, or steps, THEN THE Recipe_Service SHALL return an HTTP 500 status code with an error message

### Requirement 3: Recipe Display

**User Story:** As a user, I want to see a well-formatted recipe on my screen, so that I can follow the cooking instructions easily

#### Acceptance Criteria

1. WHEN the Recipe_Generator_UI receives a Recipe_Response, THE Recipe_Generator_UI SHALL display the recipe title
2. WHEN the Recipe_Generator_UI receives a Recipe_Response, THE Recipe_Generator_UI SHALL display the recipe description
3. WHEN the Recipe_Generator_UI receives a Recipe_Response, THE Recipe_Generator_UI SHALL display ingredients marked as you-have category with a visual indicator distinguishable from ingredients marked as you-may-need category by at least one of the following: separate labeled sections, distinct icons, or grouping with subheadings
4. WHEN the Recipe_Generator_UI receives a Recipe_Response, THE Recipe_Generator_UI SHALL display cooking steps in ascending numerical order starting from 1
5. WHEN the Recipe_Generator_UI receives a Recipe_Response containing cooking time, THE Recipe_Generator_UI SHALL display the cooking time value in minutes if less than 60 minutes, or in hours and minutes format if 60 minutes or greater
6. WHEN the Recipe_Generator_UI receives a Recipe_Response containing servings, THE Recipe_Generator_UI SHALL display the servings value as a positive integer or range
7. IF the Recipe_Response is missing the title field, THEN THE Recipe_Generator_UI SHALL display an error message indicating the recipe could not be loaded
8. IF the Recipe_Response is missing the ingredients field, THEN THE Recipe_Generator_UI SHALL display an error message indicating the recipe could not be loaded
9. IF the Recipe_Response is missing the steps field, THEN THE Recipe_Generator_UI SHALL display an error message indicating the recipe could not be loaded

### Requirement 4: Recipe Regeneration

**User Story:** As a user, I want to generate a different recipe using the same ingredients, so that I have variety in meal options

#### Acceptance Criteria

1. WHEN a Recipe_Response is displayed, THE Recipe_Generator_UI SHALL display a regenerate button
2. WHEN the user clicks the regenerate button, THE Recipe_Generator_UI SHALL disable the regenerate button
3. WHEN the user clicks the regenerate button, THE Recipe_Generator_UI SHALL send the original Ingredient_List to the Recipe_API with a request parameter indicating regeneration
4. WHEN the Recipe_Service receives a request with the regeneration parameter set, THE Recipe_Service SHALL invoke the Bedrock_Client with instructions to generate a different recipe than previous responses
5. WHEN a new Recipe_Response is received from a regeneration request, THE Recipe_Generator_UI SHALL replace the previous recipe with the new recipe
6. WHEN a new Recipe_Response is received from a regeneration request, THE Recipe_Generator_UI SHALL enable the regenerate button
7. IF the regeneration request fails or times out after 30 seconds, THEN THE Recipe_Generator_UI SHALL display an error message and enable the regenerate button

### Requirement 5: Mobile-First Responsive Design

**User Story:** As a mobile user, I want the application to work well on my phone screen, so that I can use it while shopping or in the kitchen

#### Acceptance Criteria

1. WHEN the Recipe_Generator_UI is rendered on a viewport between 375px and 430px wide inclusive, THE Recipe_Generator_UI SHALL display all content in a single-column layout without horizontal scrolling
2. WHEN the Recipe_Generator_UI is rendered on a viewport between 431px and 1920px wide inclusive, THE Recipe_Generator_UI SHALL display content in a layout adapted to the available screen width without horizontal scrolling
3. THE Recipe_Generator_UI SHALL render text with a minimum font size of 16px for body content
4. THE Recipe_Generator_UI SHALL render interactive elements with a minimum touch target size of 44px by 44px
5. THE Recipe_Generator_UI SHALL maintain a minimum spacing of 8px between adjacent interactive elements
6. WHEN text content exceeds the viewport width, THE Recipe_Generator_UI SHALL wrap the text to the next line

### Requirement 6: API Rate Limiting and Cost Protection

**User Story:** As the system owner, I want to limit API request rates, so that I protect against cost overruns on the public endpoint

#### Acceptance Criteria

1. THE Throttle_Limiter SHALL enforce rate limiting at the API Gateway stage level using a usage plan
2. THE Throttle_Limiter SHALL reject requests that exceed 3 requests per second at the stage level
3. WHEN the Throttle_Limiter rejects a request, THE Recipe_API SHALL return an HTTP 429 status code
4. WHEN the Throttle_Limiter rejects a request, THE Recipe_API SHALL return the default error response provided by API Gateway HTTP API for throttled requests (custom Retry-After header and custom JSON error body are not natively supported by HTTP API v2 without additional configuration, and are out of scope for this MVP)
5. WHEN the Recipe_Generator_UI receives an HTTP 429 response, THE Recipe_Generator_UI SHALL treat any 429 status code as a rate-limit event regardless of response body format, and display a generic wait message to the user


### Requirement 7: Stateless Operation

**User Story:** As the system owner, I want the application to operate without a database, so that I minimize infrastructure costs and complexity

#### Acceptance Criteria

1. WHEN the Recipe_Service receives a recipe generation request, THE Recipe_Service SHALL derive all processing logic from the request payload and environment configuration without reading from durable storage
2. THE Recipe_Service SHALL NOT write Ingredient_Lists to any durable storage system including databases, file systems, or object storage
3. THE Recipe_Service SHALL NOT write Recipe_Responses to any durable storage system including databases, file systems, or object storage
4. THE Recipe_Service SHALL NOT write request metadata to any durable storage system including databases, file systems, or object storage
5. WHEN the Recipe_Service encounters an error, THE Recipe_Service SHALL log the error to CloudWatch Logs without persisting error state to durable storage between requests

### Requirement 8: Error Handling

**User Story:** As a user, I want to see helpful error messages when something goes wrong, so that I understand what happened and what to do next

#### Acceptance Criteria

1. WHEN the Recipe_Service encounters an error invoking the Bedrock_Client, THE Recipe_Service SHALL return an HTTP 500 status code with a JSON response body containing an error message field with the value "Unable to generate recipe. Please try again."
2. WHEN the Recipe_Service encounters an error invoking the Bedrock_Client, THE Recipe_Service SHALL log the detailed error message to CloudWatch Logs
3. WHEN the Recipe_Generator_UI receives an HTTP 500 response from the Recipe_API, THE Recipe_Generator_UI SHALL display the error message from the response body
4. WHEN the Recipe_Generator_UI cannot establish a connection to the Recipe_API, THE Recipe_Generator_UI SHALL display the message "Cannot connect to recipe service. Please check your internet connection."
5. WHEN the Recipe_API does not respond within 30 seconds, THE Recipe_Generator_UI SHALL display the message "Request timed out. Please try again."
6. WHEN the Recipe_Generator_UI receives an HTTP 503 response from the Recipe_API, THE Recipe_Generator_UI SHALL display the message "Recipe service is temporarily unavailable. Please try again later."

### Requirement 9: Infrastructure Deployment

**User Story:** As a developer, I want to deploy the application infrastructure using AWS CDK, so that I can manage resources as code

#### Acceptance Criteria

1. THE CDK_Stack SHALL define the Recipe_API as an API Gateway HTTP API in us-east-1 region
2. THE CDK_Stack SHALL define a POST route on the Recipe_API at path /generate mapped to the Recipe_Service Lambda function
3. THE CDK_Stack SHALL define the Recipe_Service as a Lambda function using Node.js runtime version 20.x or later in us-east-1 region
4. THE CDK_Stack SHALL configure the Recipe_Service with a timeout of 30 seconds
5. THE CDK_Stack SHALL configure the Recipe_Service with 512 MB of memory
6. THE CDK_Stack SHALL configure the Recipe_Service with an IAM policy allowing the bedrock:InvokeModel action on the resource arn:aws:bedrock:us-east-1:986119050917:inference-profile/global.anthropic.claude-haiku-4-5-20251001-v1:0
7. THE CDK_Stack SHALL define an S3 bucket for hosting the Recipe_Generator_UI static files with public access blocked, serving content only via CloudFront using Origin Access Control (OAC)
8. THE CDK_Stack SHALL define a CloudFront distribution with the S3 bucket as the origin serving the Recipe_Generator_UI
9. THE CDK_Stack SHALL configure the Throttle_Limiter on the Recipe_API with a rate limit of 3 requests per second at the stage level
10. THE CDK_Stack SHALL configure the Throttle_Limiter on the Recipe_API with a burst limit of 10 requests
11. THE CDK_Stack SHALL apply the resource naming prefix recipe-ai- to all created AWS resources
12. IF a CDK deployment operation fails, THEN THE CDK_Stack SHALL rollback all partially created resources to the previous stable state
13. THE CDK_Stack SHALL configure CORS on the Recipe_API to allow requests from the CloudFront distribution's domain, permitting POST method and standard headers
