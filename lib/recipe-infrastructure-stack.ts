import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { Construct } from 'constructs';
import * as path from 'path';

export class RecipeInfrastructureStack extends cdk.Stack {
  public readonly recipeFunction: lambda.Function;
  public readonly distribution: cloudfront.Distribution;
  public readonly api: apigatewayv2.HttpApi;

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

    // Task 5: Create S3 bucket and CloudFront distribution
    // Fulfills REQ-9.7, REQ-9.8

    // S3 bucket for static website files with public access blocked (REQ-9.7)
    const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      bucketName: `recipe-ai-frontend-${this.account}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true
    });

    // Origin Access Control for secure S3 access via CloudFront only
    const oac = new cloudfront.S3OriginAccessControl(this, 'OAC', {
      signing: cloudfront.Signing.SIGV4_ALWAYS
    });

    // CloudFront distribution serving S3 bucket via OAC (REQ-9.8)
    this.distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(websiteBucket, {
          originAccessControl: oac
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        compress: true,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.seconds(0)
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.seconds(0)
        }
      ],
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100
    });

    // S3 bucket policy: Allow CloudFront OAC to read objects
    websiteBucket.addToResourcePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      principals: [new iam.ServicePrincipal('cloudfront.amazonaws.com')],
      actions: ['s3:GetObject'],
      resources: [websiteBucket.arnForObjects('*')],
      conditions: {
        StringEquals: {
          'AWS:SourceArn': `arn:aws:cloudfront::${this.account}:distribution/${this.distribution.distributionId}`
        }
      }
    }));

    // Task 6: Create HTTP API Gateway with throttling and CORS
    // Fulfills REQ-9.1, REQ-9.2, REQ-9.9, REQ-9.10, REQ-9.13, REQ-6.1, REQ-6.2, REQ-6.3, REQ-6.4, REQ-6.5

    this.api = new apigatewayv2.HttpApi(this, 'RecipeApi', {
      apiName: 'recipe-ai-api',
      // CORS configuration referencing CloudFront domain (REQ-9.13)
      corsPreflight: {
        allowOrigins: [`https://${this.distribution.distributionDomainName}`],
        allowMethods: [apigatewayv2.CorsHttpMethod.POST, apigatewayv2.CorsHttpMethod.OPTIONS],
        allowHeaders: ['Content-Type'],
        maxAge: cdk.Duration.seconds(300)
      },
      // Create default stage with throttling configuration (REQ-9.9, REQ-9.10, REQ-6.1, REQ-6.2)
      createDefaultStage: true,
      defaultStage: {
        throttle: {
          rateLimit: 3,      // 3 requests per second at stage level (REQ-9.9, REQ-6.1, REQ-6.2)
          burstLimit: 10     // Burst capacity of 10 requests (REQ-9.10)
        }
      }
    });

    // Add POST /generate route with Lambda integration (REQ-9.2)
    this.api.addRoutes({
      path: '/generate',
      methods: [apigatewayv2.HttpMethod.POST],
      integration: new integrations.HttpLambdaIntegration('RecipeIntegration', this.recipeFunction)
    });

    // Task 7: Add stack outputs for deployment
    // Fulfills REQ-9 (deployment visibility)
    
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: this.api.apiEndpoint,
      description: 'Recipe API endpoint URL'
    });

    new cdk.CfnOutput(this, 'CloudFrontUrl', {
      value: `https://${this.distribution.distributionDomainName}`,
      description: 'CloudFront distribution URL for frontend'
    });
  }
}
