# ReqGenAI - AI-Powered Requirements Generation Platform

ReqGenAI is a comprehensive backend API that transforms unstructured input into structured project requirements, generates Business Requirement Documents (BRD), creates detailed project blueprints, and integrates with project management tools like Bitrix24.

## 🚀 Features

- **AI-Powered Requirements Extraction** - Convert any text input into structured requirements
- **Business Requirement Document (BRD) Generation** - Create professional BRDs automatically
- **Project Blueprint Creation** - Generate detailed project plans with timelines and resources
- **Bitrix24 Integration** - Automatically create projects and tasks in Bitrix24
- **Comprehensive Logging** - Track all activities and API calls
- **User Management** - Role-based access control
- **MongoDB Integration** - Scalable data storage with MongoDB Atlas

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   ReqGenAI      │    │   n8n Cloud     │
│   (React/Next)  │◄──►│   Express API   │◄──►│   AI Workflows  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   MongoDB       │
                       │   Atlas         │
                       └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Bitrix24      │
                       │   Project Mgmt  │
                       └─────────────────┘
```

## 📋 Tech Stack

- **Backend**: Express.js with JavaScript
- **Database**: MongoDB Atlas
- **AI Processing**: n8n Cloud workflows
- **Project Management**: Bitrix24 integration
- **Authentication**: API Key-based
- **Logging**: Custom logging service with MongoDB storage

## 🛠️ Installation

### Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account
- n8n Cloud account
- Bitrix24 account (optional)

### Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd ReqGenAI
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Configuration**

   ```bash
   cp env.example .env
   ```

   Update `.env` with your configuration:

   ```env
   # Application Configuration
   PORT=3000
   NODE_ENV=development
   API_KEY=your_secure_api_key_here

   # MongoDB Atlas Configuration
   MONGODB_URI=mongodb+srv://reqgenai:reqgenai@cluster0.0n6oysl.mongodb.net/requirementsDB?retryWrites=true&w=majority&appName=Cluster0

   # N8N Integration URLs
   N8N_REQUIREMENT_EXTRACTION_URL=https://reqgenai.app.n8n.cloud/webhook/requirement-extraction
   N8N_BRD_GENERATION_URL=https://reqgenai.app.n8n.cloud/webhook/brd-generation
   N8N_REQUIREMENT_BLUEPRINT_URL=https://reqgenai.app.n8n.cloud/webhook/requirement-blueprint

   # Bitrix24 Integration
   BITRIX24_BASE_URL=https://b24-kb0ki5.bitrix24.in/rest/1/3jg6d1as4kwbc9vc/
   BITRIX24_WEBHOOK_URL=https://b24-kb0ki5.bitrix24.in/rest/1/3jg6d1as4kwbc9vc/
   ```

4. **Start the server**

   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

## 📚 API Documentation

### Authentication

All API endpoints require an `x-api-key` header:

```bash
curl -H "x-api-key: your_api_key_here" http://localhost:3000/api/endpoint
```

### Core Endpoints

#### 1. Input Processing

```bash
# Manual input
POST /api/inputs/manual
{
  "content": "We want a mobile app for food delivery..."
}

# Transcript input
POST /api/inputs/transcript
{
  "content": "Meeting transcript...",
  "source": "zoom"
}

# File input
POST /api/inputs/file
{
  "filename": "requirements.txt",
  "text": "File content..."
}
```

#### 2. Actions

```bash
# Extract requirements
POST /api/actions/extract/:projectId

# Generate BRD
POST /api/actions/brd/:projectId

# Generate blueprint
POST /api/actions/blueprint/:projectId

# Create Bitrix24 project
POST /api/actions/bitrix24/create-project/:projectId
```

#### 3. Project Management

```bash
# Get project details
GET /api/projects/:projectId

# List all projects
GET /api/projects?page=1&limit=10&status=completed

# Get project document
GET /api/projects/:projectId/documents/:documentId
```

#### 4. Bitrix24 Integration

```bash
# Get Bitrix24 task
GET /api/actions/bitrix24/task/:taskId

# Assign task
POST /api/actions/bitrix24/assign/:taskId
{
  "userId": 5,
  "comment": "Assigned to frontend developer"
}
```

### Webhook Endpoints (for n8n)

```bash
# Requirements webhook
POST /api/webhooks/requirements
{
  "project_info": {...},
  "requirements": {...},
  "constraints": [...]
}

# BRD webhook
POST /api/webhooks/brd
{
  "project_info": {...},
  "brd_text": "# Business Requirement Document..."
}

# Blueprint webhook
POST /api/webhooks/blueprint
{
  "project_id": "12345",
  "blueprint": {...}
}
```

## 🗄️ Database Schema

### Collections

#### Projects

```javascript
{
  projectId: String (UUID),
  name: String,
  description: String,
  source: String, // manual, transcript, file, email, webhook
  status: String, // created, processing, completed, failed
  totalDocuments: Number,
  metadata: Object,
  createdAt: Date,
  updatedAt: Date
}
```

#### Documents

```javascript
{
  documentId: String (UUID),
  projectId: String,
  type: String, // RAW_INPUT, REQUIREMENTS, BRD, BLUEPRINT, DRAFT
  content: Object,
  version: Number,
  sourceHash: String,
  metadata: Object,
  createdAt: Date,
  updatedAt: Date
}
```

#### Users

```javascript
{
  userId: String (UUID),
  email: String,
  name: String,
  role: String, // admin, project_manager, developer, designer, qa, client
  department: String,
  skills: [String],
  bitrix24UserId: String,
  preferences: Object,
  status: String, // active, inactive, suspended
  totalProjects: Number,
  completedTasks: Number,
  createdAt: Date,
  updatedAt: Date
}
```

#### ActivityLogs

```javascript
{
  logId: String (UUID),
  userId: String,
  projectId: String,
  action: String,
  description: String,
  details: Object,
  ipAddress: String,
  userAgent: String,
  status: String, // success, error, warning, info
  duration: Number,
  createdAt: Date
}
```

## 🔄 Workflow

### Complete Project Lifecycle

1. **Input Submission**

   ```bash
   POST /api/inputs/manual
   # → Creates project with UUID
   # → Stores RAW_INPUT document
   # → Automatically triggers requirement extraction
   ```

2. **Requirements Extraction**

   ```bash
   # n8n processes input → calls webhook
   POST /api/webhooks/requirements
   # → Stores REQUIREMENTS document
   # → Updates project status
   ```

3. **BRD Generation**

   ```bash
   POST /api/actions/brd/:projectId
   # → Calls n8n BRD webhook
   # → Stores BRD document
   ```

4. **Blueprint Creation**

   ```bash
   POST /api/actions/blueprint/:projectId
   # → Calls n8n blueprint webhook
   # → Stores BLUEPRINT document
   ```

5. **Bitrix24 Integration**
   ```bash
   POST /api/actions/bitrix24/create-project/:projectId
   # → Creates main project task
   # → Creates feature subtasks
   # → Creates milestone tasks
   # → Updates project metadata
   ```

## 📊 Logging & Monitoring

### Activity Logging

All activities are automatically logged:

- API requests and responses
- Project lifecycle events
- Integration activities
- Error occurrences
- User actions

### Log Queries

```bash
# Get project activity
GET /api/logs?projectId=123&action=project_created

# Get user activity
GET /api/logs?userId=456&status=success

# Get error logs
GET /api/logs?status=error&startDate=2024-01-01
```

## 🔧 Configuration

### Environment Variables

| Variable                         | Description               | Default     |
| -------------------------------- | ------------------------- | ----------- |
| `PORT`                           | Server port               | 3000        |
| `NODE_ENV`                       | Environment               | development |
| `API_KEY`                        | API authentication key    | Required    |
| `MONGODB_URI`                    | MongoDB connection string | Required    |
| `N8N_REQUIREMENT_EXTRACTION_URL` | n8n extraction webhook    | Required    |
| `N8N_BRD_GENERATION_URL`         | n8n BRD webhook           | Required    |
| `N8N_REQUIREMENT_BLUEPRINT_URL`  | n8n blueprint webhook     | Required    |
| `BITRIX24_WEBHOOK_URL`           | Bitrix24 webhook URL      | Optional    |
| `LOGGING_ENABLED`                | Enable/disable logging    | true        |

### MongoDB Indexes

The following indexes are automatically created:

- `projectId` (unique)
- `documentId` (unique)
- `userId` (unique)
- `email` (unique)
- `logId` (unique)
- Compound indexes for common queries

## 🚀 Deployment

### Production Deployment

1. **Environment Setup**

   ```bash
   export NODE_ENV=production
   export MONGODB_URI=your_production_mongodb_uri
   export API_KEY=your_secure_production_api_key
   ```

2. **Start Application**

   ```bash
   npm start
   ```

3. **Health Check**
   ```bash
   curl http://localhost:3000/health
   ```

### Docker Deployment (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🔒 Security

- **API Key Authentication** - All endpoints require valid API key
- **Rate Limiting** - 100 requests per 15 minutes per IP
- **Input Validation** - All inputs are validated and sanitized
- **Error Handling** - Comprehensive error handling without data leakage
- **CORS Configuration** - Configurable CORS settings

## 📈 Performance

- **MongoDB Indexing** - Optimized queries with proper indexes
- **Connection Pooling** - Efficient database connections
- **Request Timeout** - 30-second timeout for AI processing
- **Error Recovery** - Graceful error handling and recovery

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Check the API documentation
- Review the logs for debugging

## 🔮 Roadmap

- [ ] User authentication and authorization
- [ ] Real-time notifications
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Additional integrations (Slack, Teams, etc.)
- [ ] Mobile app support
- [ ] Advanced AI model integration
