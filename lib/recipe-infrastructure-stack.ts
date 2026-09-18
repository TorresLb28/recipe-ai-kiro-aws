import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class RecipeInfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Stack resources will be added in subsequent tasks:
    // - Lambda function (Task 4)
    // - S3 bucket and CloudFront distribution (Task 5)
    // - HTTP API Gateway (Task 6)
    // - Stack outputs (Task 7)
  }
}
