\# Recipe AI — Project Context



\## Purpose

Demo/portfolio project. Recipe generator using AI. NOT production — will be deployed, tested, and torn down.



\## Tech Stack

\- Frontend: React + Vite

\- Frontend hosting: Amazon S3 + CloudFront (NOT Amplify)

\- API: Amazon API Gateway (HTTP API, not REST API)

\- Backend: AWS Lambda (Node.js, latest supported runtime)

\- AI: Amazon Bedrock, model Claude Haiku 4.5

&#x20; - Exact model ARN: arn:aws:bedrock:us-east-1:986119050917:inference-profile/global.anthropic.claude-haiku-4-5-20251001-v1:0

\- Database: none (stateless app)

\- IaC: AWS CDK (TypeScript)

\- Auth: none (public demo endpoint)



\## AWS Account Context

\- Region: us-east-1

\- IAM user for deployment: recipe-ai-admin

\- Budget limit: $2 USD max (be cost-conscious in all suggestions)



\## Design Requirements

\- Mobile-first responsive UI (primary target viewport: 375-430px), must also work on desktop

\- API Gateway should have basic throttling (rate limit \~3 req/sec) to protect against cost overrun on public endpoint



\## Naming Convention

\- Resource prefix: recipe-ai-



\## Out of scope for MVP

\- User accounts/auth

\- Saving/favoriting recipes

\- Image generation

\- Dietary filters

