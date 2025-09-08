# ReqGenAI API Documentation

## Base URL

```
http://localhost:3000/api
```

## Authentication

All API endpoints require an `x-api-key` header for authentication.

```bash
curl -H "x-api-key: your_api_key_here" http://localhost:3000/api/endpoint
```

## Response Format

### Success Response

```json
{
  "success": true,
  "data": {...},
  "message": "Operation completed successfully"
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional error details"
}
```

## Endpoints

### 1. Input Processing

#### POST /inputs/manual

Create a new project from manual input.

**Request Body:**

```json
{
  "content": "We want a mobile app for food delivery. It should allow users to order, pay online, and track delivery. The launch should be in 4 months with a budget around $30,000."
}
```

**Response:**

```json
{
  "success": true,
  "projectId": "uuid-generated",
  "documentId": "uuid-generated",
  "extractionResult": "completed"
}
```

#### POST /inputs/transcript

Create a new project from meeting transcript.

**Request Body:**

```json
{
  "content": "Meeting transcript content...",
  "source": "zoom"
}
```

#### POST /inputs/file

Create a new project from file content.

**Request Body:**

```json
{
  "filename": "requirements.txt",
  "text": "File content here..."
}
```

### 2. Actions

#### POST /actions/extract/:projectId

Manually trigger requirement extraction for an existing project.

**Response:**

```json
{
  "success": true,
  "status": "completed",
  "message": "Requirements extracted successfully",
  "documentId": "uuid-generated",
  "requirements": {
    "project_info": {...},
    "requirements": {...},
    "constraints": [...]
  }
}
```

#### POST /actions/brd/:projectId

Generate Business Requirement Document from extracted requirements.

**Response:**

```json
{
  "success": true,
  "status": "completed",
  "message": "BRD generated successfully",
  "documentId": "uuid-generated",
  "brd": "# Business Requirement Document (BRD)\n\n## Project ID & Project Name..."
}
```

#### POST /actions/blueprint/:projectId

Generate project blueprint from requirements.

**Response:**

```json
{
  "success": true,
  "status": "completed",
  "message": "Requirement blueprint generated successfully",
  "documentId": "uuid-generated",
  "blueprint": {
    "project_id": "12345",
    "blueprint": {
      "project_overview": {...},
      "feature_breakdown": [...],
      "technical_architecture": {...},
      "timeline_milestones": [...],
      "resource_requirements": [...],
      "risk_assessment": [...]
    }
  }
}
```

### 3. Bitrix24 Integration

#### POST /actions/bitrix24/create-project/:projectId

Create a project and subtasks in Bitrix24 from blueprint.

**Request Body:**

```json
{
  "assignToUserId": 1
}
```

**Response:**

```json
{
  "success": true,
  "message": "Bitrix24 project and subtasks created successfully",
  "bitrix24": {
    "mainTaskId": "123",
    "subtasks": [
      {
        "feature": "User Registration and Login",
        "taskId": "124",
        "priority": "High"
      }
    ],
    "totalSubtasks": 5
  }
}
```

#### GET /actions/bitrix24/task/:taskId

Get Bitrix24 task details.

**Response:**

```json
{
  "success": true,
  "task": {
    "id": "123",
    "title": "Food Delivery Mobile App",
    "description": "Project description...",
    "status": "2",
    "priority": "2",
    "responsibleId": "1"
  }
}
```

#### POST /actions/bitrix24/assign/:taskId

Assign a Bitrix24 task to a user.

**Request Body:**

```json
{
  "userId": 5,
  "comment": "Assigned to frontend developer"
}
```

### 4. Project Management

#### GET /projects/:projectId

Get project details with all documents.

**Response:**

```json
{
  "success": true,
  "project": {
    "projectId": "uuid",
    "name": "Project Name",
    "description": "Project description",
    "source": "manual",
    "status": "completed",
    "totalDocuments": 3,
    "metadata": {...},
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "documents": [
    {
      "documentId": "uuid",
      "type": "RAW_INPUT",
      "version": 1,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### GET /projects

List all projects with pagination.

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by status

**Response:**

```json
{
  "success": true,
  "projects": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

#### GET /projects/:projectId/documents/:documentId

Get specific document content.

**Response:**

```json
{
  "success": true,
  "document": {
    "documentId": "uuid",
    "projectId": "uuid",
    "type": "REQUIREMENTS",
    "content": {...},
    "version": 1,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 5. Infrastructure

#### GET /infra/health

Get system health status.

**Response:**

```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "environment": "development",
  "database": {
    "status": "connected",
    "connection": 1
  },
  "memory": {
    "used": "45 MB",
    "total": "128 MB"
  }
}
```

#### GET /infra/status

Get detailed system status.

**Response:**

```json
{
  "message": "Service status retrieved",
  "data": {
    "uptime": 3600,
    "memory": {...},
    "version": "v18.0.0",
    "platform": "linux",
    "database": {
      "status": "connected",
      "collections": 4,
      "dataSize": "2 MB",
      "storageSize": "4 MB"
    }
  }
}
```

## Webhook Endpoints (for n8n)

### POST /webhooks/requirements

Receive extracted requirements from n8n.

**Request Body:**

```json
{
  "project_info": {
    "id": "12345",
    "name": "Food Delivery Mobile App",
    "description": "A mobile app for food delivery...",
    "business_objectives": [...],
    "success_metrics": [...],
    "stakeholders": [...]
  },
  "requirements": {
    "functional": [...],
    "non_functional": [...]
  },
  "constraints": [...],
  "preferred_format": "Markdown"
}
```

### POST /webhooks/brd

Receive generated BRD from n8n.

**Request Body:**

```json
{
  "project_info": {
    "id": "12345"
  },
  "brd_text": "# Business Requirement Document (BRD)\n\n## Project ID & Project Name...",
  "format": "Markdown"
}
```

### POST /webhooks/blueprint

Receive generated blueprint from n8n.

**Request Body:**

```json
{
  "project_id": "12345",
  "blueprint": {
    "project_overview": {...},
    "feature_breakdown": [...],
    "technical_architecture": {...},
    "timeline_milestones": [...],
    "resource_requirements": [...],
    "risk_assessment": [...]
  },
  "preferred_format": "Markdown"
}
```

## Error Codes

| Code | Description                               |
| ---- | ----------------------------------------- |
| 400  | Bad Request - Invalid input data          |
| 401  | Unauthorized - Invalid or missing API key |
| 404  | Not Found - Resource not found            |
| 500  | Internal Server Error - Server error      |

## Rate Limiting

- **Limit**: 100 requests per 15 minutes per IP address
- **Headers**:
  - `X-RateLimit-Limit`: Request limit
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset time

## Examples

### Complete Workflow Example

```bash
# 1. Create input
curl -X POST http://localhost:3000/api/inputs/manual \
  -H "Content-Type: application/json" \
  -H "x-api-key: your_api_key" \
  -d '{"content": "We want a mobile app for food delivery..."}'

# Response: {"success": true, "projectId": "abc123", ...}

# 2. Generate BRD
curl -X POST http://localhost:3000/api/actions/brd/abc123 \
  -H "Content-Type: application/json" \
  -H "x-api-key: your_api_key" \
  -d '{}'

# 3. Generate Blueprint
curl -X POST http://localhost:3000/api/actions/blueprint/abc123 \
  -H "Content-Type: application/json" \
  -H "x-api-key: your_api_key" \
  -d '{}'

# 4. Create Bitrix24 Project
curl -X POST http://localhost:3000/api/actions/bitrix24/create-project/abc123 \
  -H "Content-Type: application/json" \
  -H "x-api-key: your_api_key" \
  -d '{"assignToUserId": 1}'

# 5. Get Project Details
curl -X GET http://localhost:3000/api/projects/abc123 \
  -H "x-api-key: your_api_key"
```
