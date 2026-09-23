#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { RecipeInfrastructureStack } from '../lib/recipe-infrastructure-stack';

const app = new cdk.App();

new RecipeInfrastructureStack(app, 'RecipeAiStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1'
  }
});

app.synth();