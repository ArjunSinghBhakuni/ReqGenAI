# Deployment Architecture - ReqGenAI

This document outlines the deployment architecture for the ReqGenAI system, showing how components are distributed across different environments and cloud providers.

## Deployment Overview

```mermaid
graph TD
    %% Client Side
    subgraph "Client Side"
        User[👤 User<br/>Browser/Desktop]
        Frontend[🌐 Frontend App<br/>React/Next.js<br/>Vercel/Netlify/S3+CloudFront]
    end
    
    %% AWS Cloud Infrastructure
    subgraph "AWS Cloud"
        subgraph "Compute Layer"
            Backend[🐳 NestJS API<br/>Docker Container<br/>ECS Fargate/Elastic Beanstalk<br/>Load Balancer]
        end
        
        subgraph "Storage Layer"
            DynamoDB[🗄️ DynamoDB<br/>Projects Table<br/>Documents Table]
            S3[📁 S3 Bucket<br/>File Storage<br/>Static Assets]
        end
        
        subgraph "Cache Layer"
            Redis[⚡ Redis<br/>ElastiCache/Redis Cloud<br/>Session & AI Cache]
        end
        
        subgraph "Monitoring & Logs"
            CloudWatch[📊 CloudWatch<br/>Logs & Metrics<br/>Alarms & Dashboards]
        end
    end
    
    %% n8n Cloud
    subgraph "n8n Cloud"
        N8N[🔄 n8n Workflows<br/>Gmail Trigger<br/>AI Processing<br/>Webhook Endpoints]
    end
    
    %% External Services
    subgraph "External Services"
        Gmail[📧 Gmail<br/>Email Triggers<br/>Label-based Processing]
        OpenAI[🤖 OpenAI API<br/>GPT-4/Gemini<br/>AI Processing]
    end
    
    %% User Interactions
    User -->|HTTPS/API Calls| Frontend
    Frontend -->|REST API<br/>x-api-key auth| Backend
    
    %% Frontend to Backend API Calls
    Frontend -->|POST /inputs/manual<br/>POST /inputs/transcript<br/>POST /inputs/file| Backend
    Frontend -->|POST /actions/extract<br/>POST /actions/brd<br/>POST /actions/blueprint| Backend
    Frontend -->|GET /cache/check<br/>GET /infra/health| Backend
    
    %% Gmail to n8n Flow
    Gmail -->|Email Trigger<br/>Label: ReqGenAI| N8N
    
    %% n8n Processing Flow
    N8N -->|AI Processing<br/>Requirements Extraction| OpenAI
    N8N -->|AI Processing<br/>BRD Generation| OpenAI
    N8N -->|AI Processing<br/>Blueprint Creation| OpenAI
    
    %% n8n to Backend Webhooks
    N8N -->|POST /webhooks/requirements<br/>POST /webhooks/brd<br/>POST /webhooks/blueprint<br/>POST /webhooks/draft| Backend
    
    %% Backend to n8n Actions
    Backend -->|POST to n8n webhooks<br/>Trigger AI workflows| N8N
    
    %% Backend Data Persistence
    Backend -->|Projects & Documents<br/>CRUD Operations| DynamoDB
    Backend -->|File Uploads<br/>Static Assets| S3
    Backend -->|Cache Operations<br/>Session Storage| Redis
    
    %% Monitoring
    Backend -->|Logs & Metrics| CloudWatch
    DynamoDB -->|Metrics| CloudWatch
    Redis -->|Metrics| CloudWatch
    
    %% Styling
    classDef aws fill:#ff9900,stroke:#232f3e,stroke-width:2px,color:#fff
    classDef n8n fill:#ea4c89,stroke:#000,stroke-width:2px,color:#fff
    classDef client fill:#61dafb,stroke:#20232a,stroke-width:2px,color:#000
    classDef external fill:#4285f4,stroke:#000,stroke-width:2px,color:#fff
    
    class Backend,DynamoDB,S3,Redis,CloudWatch aws
    class N8N n8n
    class User,Frontend client
    class Gmail,OpenAI external
```

## Infrastructure Components

### AWS Cloud Services

#### Compute Layer
- **ECS Fargate** or **Elastic Beanstalk**
  - Docker container hosting NestJS API
  - Auto-scaling based on CPU/memory usage
  - Load balancer for high availability
  - Environment: Production, Staging, Development

#### Storage Layer
- **DynamoDB**
  - Projects table: Project metadata and status
  - Documents table: Requirements, BRDs, blueprints, drafts
  - Global Secondary Indexes for efficient querying
  - On-demand billing for variable workloads

- **S3 Bucket**
  - File uploads and attachments
  - Static assets and documentation
  - Versioning and lifecycle policies
  - CloudFront CDN for global distribution

#### Cache Layer
- **ElastiCache (Redis)**
  - Session management
  - AI processing result caching
  - Rate limiting and temporary data
  - Multi-AZ deployment for high availability

#### Monitoring & Observability
- **CloudWatch**
  - Application logs and metrics
  - Custom dashboards and alarms
  - Performance monitoring
  - Cost tracking and optimization

### n8n Cloud
- **Workflow Management**
  - Gmail trigger for email processing
  - AI-powered document generation
  - Webhook endpoints for result delivery
  - Workflow versioning and backup

### Frontend Deployment
- **Vercel/Netlify** (Recommended)
  - Serverless deployment
  - Global CDN
  - Automatic SSL certificates
  - Git-based deployments

- **Alternative: S3 + CloudFront**
  - Static website hosting
  - Custom domain configuration
  - Manual deployment process

## Security Considerations

### API Security
- API key authentication for all endpoints
- HTTPS/TLS encryption for all communications
- CORS configuration for frontend access
- Rate limiting and DDoS protection

### Data Security
- DynamoDB encryption at rest and in transit
- S3 bucket encryption and access policies
- Redis AUTH and TLS encryption
- Environment variable management

### Network Security
- VPC configuration for backend services
- Security groups and NACLs
- Private subnets for database access
- WAF for web application protection

## Scaling Strategy

### Horizontal Scaling
- ECS Fargate auto-scaling based on metrics
- DynamoDB on-demand capacity
- Redis cluster mode for high availability
- CDN for static content distribution

### Performance Optimization
- Redis caching for frequently accessed data
- DynamoDB query optimization
- Connection pooling for database access
- Async processing for long-running tasks

## Deployment Process

### Development Environment
```bash
# Local development
npm run start:dev
docker-compose up -d redis dynamodb-local
```

### Staging Environment
```bash
# Deploy to staging
docker build -t reqgenai:staging .
aws ecs update-service --cluster staging --service reqgenai
```

### Production Environment
```bash
# Deploy to production
docker build -t reqgenai:latest .
aws ecs update-service --cluster production --service reqgenai
```

## Monitoring & Alerting

### Key Metrics
- API response times and error rates
- DynamoDB read/write capacity utilization
- Redis memory usage and hit rates
- Container CPU and memory usage

### Alerts
- High error rates (>5%)
- Database connection failures
- Cache miss rates above threshold
- Container health check failures

This deployment architecture ensures high availability, scalability, and security for the ReqGenAI system across different environments.
