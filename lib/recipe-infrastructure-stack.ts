import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as path from 'path';

export class RecipeInfrastructureStack extends cdk.Stack {
  public readonly recipeFunction: lambda.Function;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Task 4: Create Lambda function for recipe generation
    // Fulfills REQ-9.3, REQ-9.4, REQ-9.5, REQ-9.6
    this.recipeFunction = new lambda.Function(this, 'RecipeFunction', {
      functionName: 'recipe-ai-service',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda')),
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: {
        // Model ARN from REQ-2.2
        BEDROCK_MODEL_ARN: 'arn:aws:bedrock:us-east-1:986119050917:inference-profile/global.anthropic.claude-haiku-4-5-20251001-v1:0'
      }
    });

    // Add IAM policy: Allow Bedrock InvokeModel on specific model ARN (REQ-9.6)
    this.recipeFunction.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['bedrock:InvokeModel'],
      resources: ['arn:aws:bedrock:us-east-1:986119050917:inference-profile/global.anthropic.claude-haiku-4-5-20251001-v1:0']
    }));

    // Add IAM policy: Allow CloudWatch Logs (automatic via Lambda execution role)
    this.recipeFunction.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents'
      ],
      resources: [`arn:aws:logs:us-east-1:*:log-group:/aws/lambda/recipe-ai-*`]
    }));

    // Stack resources will be added in subsequent tasks:
    // - S3 bucket and CloudFront distribution (Task 5)
    // - HTTP API Gateway (Task 6)
    // - Stack outputs (Task 7)
  }
}
