# ReqGenAI - Separate Frontend & Server Deployment Guide

This guide explains how to deploy the ReqGenAI application with separate frontend and server deployments.

## Project Structure

```
ReqGenAI/
├── frontend/          # React frontend application
├── server/            # Express.js backend API
├── docs/              # Documentation
├── n8n-workflows/     # N8N workflow files
├── postman/           # API testing collection
└── package.json       # Monorepo configuration
```

## Prerequisites

- Node.js 18+ and npm 8+
- MongoDB Atlas account
- Vercel account (for server deployment)
- Netlify or Vercel account (for frontend deployment)

## Environment Setup

### 1. Server Environment Variables

Create a `.env` file in the `server/` directory:

```bash
# Copy from server/env.example
cp server/env.example server/.env
```

Update the following variables in `server/.env`:

```env
# Application Configuration
PORT=8080
NODE_ENV=production
API_KEY=your_api_key_here

# MongoDB Atlas Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# Frontend Configuration (for CORS)
FRONTEND_URL=https://reqgenai-frontend.vercel.app
PRODUCTION_FRONTEND_URL=https://reqgenai.netlify.app
VERCEL_FRONTEND_URL=https://reqgenai-frontend.vercel.app

# N8N Integration URLs
N8N_REQUIREMENT_EXTRACTION_URL=https://reqgenai.app.n8n.cloud/webhook/requirement-extraction
N8N_BRD_GENERATION_URL=https://reqgenai.app.n8n.cloud/webhook/brd-generation
N8N_REQUIREMENT_BLUEPRINT_URL=https://reqgenai.app.n8n.cloud/webhook/requirement-blueprint

# Bitrix24 Integration
BITRIX24_BASE_URL=https://b24-kb0ki5.bitrix24.in/rest/1/3jg6d1as4kwbc9vc/
BITRIX24_WEBHOOK_URL=https://b24-kb0ki5.bitrix24.in/rest/1/3jg6d1as4kwbc9vc/
BITRIX24_PROJECT_WEBHOOK_URL=https://b24-kb0ki5.bitrix24.in/rest/1/jbej2i8xtuzcjndz/

# AWS S3 Configuration
AWS_REGION=your-aws-region
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
S3_BUCKET=your-s3-bucket-name
```

### 2. Frontend Environment Variables

Create a `.env.local` file in the `frontend/` directory:

```bash
# Copy from frontend/env.example
cp frontend/env.example frontend/.env.local
```

Update the following variables in `frontend/.env.local`:

```env
# API Server URL
REACT_APP_API_URL=https://reqgenai-server.vercel.app
```

## Deployment Instructions

### Option 1: Vercel (Recommended)

#### Deploy Server to Vercel

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy Server**:
   ```bash
   cd server
   vercel
   ```

3. **Set Environment Variables**:
   - Go to your Vercel dashboard
   - Select your server project
   - Go to Settings > Environment Variables
   - Add all variables from `server/.env`

4. **Redeploy**:
   ```bash
   vercel --prod
   ```

#### Deploy Frontend to Vercel

1. **Deploy Frontend**:
   ```bash
   cd frontend
   vercel
   ```

2. **Set Environment Variables**:
   - Go to your Vercel dashboard
   - Select your frontend project
   - Go to Settings > Environment Variables
   - Add: `REACT_APP_API_URL=https://your-server-url.vercel.app`

3. **Redeploy**:
   ```bash
   vercel --prod
   ```

### Option 2: Netlify (Frontend) + Vercel (Server)

#### Deploy Server to Vercel

Follow the server deployment steps from Option 1.

#### Deploy Frontend to Netlify

1. **Connect Repository**:
   - Go to [Netlify](https://netlify.com)
   - Click "New site from Git"
   - Connect your GitHub repository
   - Set base directory to `frontend`

2. **Build Settings**:
   - Build command: `npm run build`
   - Publish directory: `build`

3. **Environment Variables**:
   - Go to Site settings > Environment variables
   - Add: `REACT_APP_API_URL=https://your-server-url.vercel.app`

4. **Deploy**:
   - Netlify will automatically deploy on git push

### Option 3: Docker Deployment

#### Server Docker Deployment

1. **Build Server Image**:
   ```bash
   cd server
   docker build -t reqgenai-server .
   ```

2. **Run Server Container**:
   ```bash
   docker run -p 8080:8080 --env-file .env reqgenai-server
   ```

#### Frontend Docker Deployment

1. **Create Dockerfile in frontend/**:
   ```dockerfile
   FROM node:18-alpine as build
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   COPY . .
   RUN npm run build

   FROM nginx:alpine
   COPY --from=build /app/build /usr/share/nginx/html
   COPY nginx.conf /etc/nginx/nginx.conf
   EXPOSE 80
   CMD ["nginx", "-g", "daemon off;"]
   ```

2. **Build and Run**:
   ```bash
   cd frontend
   docker build -t reqgenai-frontend .
   docker run -p 3000:80 reqgenai-frontend
   ```

## Local Development

### Start Both Services

```bash
# Install dependencies for all packages
npm run install:all

# Start both frontend and server in development mode
npm run dev
```

### Start Services Separately

```bash
# Start server only
npm run dev:server

# Start frontend only
npm run dev:frontend
```

## API Endpoints

After deployment, your server will be available at:
- Health check: `https://your-server-url.vercel.app/health`
- API docs: `https://your-server-url.vercel.app/`
- CORS test: `https://your-server-url.vercel.app/api/cors-test`

## Troubleshooting

### CORS Issues

If you encounter CORS issues:

1. **Check Server CORS Configuration**:
   - Ensure your frontend URL is in the `allowedOrigins` array in `server/app.js`
   - Verify environment variables are set correctly

2. **Check Frontend API Configuration**:
   - Ensure `REACT_APP_API_URL` is set correctly
   - Check `frontend/src/config/api.js` for proper URL construction

### Environment Variables

1. **Server Environment Variables**:
   - Ensure all required variables are set in your deployment platform
   - Check MongoDB connection string format
   - Verify N8N webhook URLs

2. **Frontend Environment Variables**:
   - Ensure `REACT_APP_API_URL` points to your deployed server
   - Variables must start with `REACT_APP_` to be accessible in React

### Database Connection

1. **MongoDB Atlas**:
   - Ensure your IP is whitelisted
   - Check connection string format
   - Verify database user permissions

## Monitoring

### Health Checks

- Server health: `GET /health`
- Server ping: `GET /ping`
- CORS test: `GET /api/cors-test`

### Logs

- **Vercel**: Check function logs in dashboard
- **Netlify**: Check deploy logs in dashboard
- **Local**: Check console output

## Security Considerations

1. **Environment Variables**:
   - Never commit `.env` files
   - Use secure, unique API keys
   - Rotate keys regularly

2. **CORS Configuration**:
   - Only allow necessary origins
   - Use HTTPS in production
   - Avoid wildcard origins

3. **Rate Limiting**:
   - Server includes rate limiting (1000 requests per 15 minutes)
   - Adjust limits based on your needs

## Support

For issues or questions:
1. Check the logs in your deployment platform
2. Verify environment variables are set correctly
3. Test API endpoints using the health check endpoints
4. Review CORS configuration if frontend can't connect to server
