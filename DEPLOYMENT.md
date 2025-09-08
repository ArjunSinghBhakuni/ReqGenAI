# 🚀 ReqGenAI Deployment Guide

## Quick Deployment Options

### 1. 🌟 Vercel (Recommended - Easiest)

**Steps:**
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and sign up
3. Click "New Project" and import your GitHub repository
4. Vercel will automatically detect the configuration from `vercel.json`
5. Set environment variables in Vercel dashboard:
   ```
   NODE_ENV=production
   MONGODB_URI=your_mongodb_connection_string
   N8N_REQUIREMENT_EXTRACTION_URL=your_n8n_webhook_url
   N8N_BRD_GENERATION_URL=your_n8n_webhook_url
   N8N_REQUIREMENT_BLUEPRINT_URL=your_n8n_webhook_url
   ```
6. Deploy! Your app will be live at `https://your-app.vercel.app`

### 2. 🐳 Railway (Great for Node.js)

**Steps:**
1. Install Railway CLI: `npm install -g @railway/cli`
2. Login: `railway login`
3. Initialize: `railway init`
4. Set environment variables: `railway variables set NODE_ENV=production`
5. Deploy: `railway up`
6. Your app will be live at `https://your-app.railway.app`

### 3. ☁️ Render (Free Tier Available)

**Steps:**
1. Go to [render.com](https://render.com) and sign up
2. Click "New Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Build Command**: `npm install && cd frontend && npm install && npm run build`
   - **Start Command**: `node app.js`
   - **Environment**: Node
5. Set environment variables in Render dashboard
6. Deploy!

### 4. 🐳 Docker Deployment

**For any Docker-compatible platform:**

1. **Build the Docker image:**
   ```bash
   docker build -t reqgenai .
   ```

2. **Run locally:**
   ```bash
   docker run -p 8080:8080 -e MONGODB_URI=your_uri reqgenai
   ```

3. **Deploy to:**
   - **DigitalOcean App Platform**: Upload Dockerfile
   - **AWS ECS**: Use Docker container
   - **Google Cloud Run**: Deploy container
   - **Azure Container Instances**: Deploy container

## 📋 Pre-Deployment Checklist

### Backend Setup
- [ ] MongoDB database created (MongoDB Atlas recommended)
- [ ] Environment variables configured
- [ ] N8N webhook URLs set up
- [ ] CORS configured for production domain

### Frontend Setup
- [ ] API base URL updated for production
- [ ] Build command tested: `cd frontend && npm run build`
- [ ] Static files served correctly

### Security
- [ ] Environment variables secured
- [ ] Rate limiting configured
- [ ] CORS properly set up
- [ ] Helmet security headers enabled

## 🔧 Environment Variables

Create these environment variables in your deployment platform:

```env
NODE_ENV=production
PORT=8080
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/reqgenai
N8N_REQUIREMENT_EXTRACTION_URL=https://your-n8n-instance.com/webhook/extract
N8N_BRD_GENERATION_URL=https://your-n8n-instance.com/webhook/brd
N8N_REQUIREMENT_BLUEPRINT_URL=https://your-n8n-instance.com/webhook/blueprint
```

## 🧪 Testing Deployment

1. **Health Check**: Visit `https://your-app.com/health`
2. **API Test**: Visit `https://your-app.com/` (should show API docs)
3. **Frontend Test**: Visit `https://your-app.com/` (should show React app)
4. **Create Project**: Test manual project creation
5. **Webhook Test**: Test email processing webhook

## 🚨 Troubleshooting

### Common Issues:

1. **Build Fails**: Check Node.js version (use 18+)
2. **MongoDB Connection**: Verify connection string and network access
3. **Static Files Not Loading**: Check if `frontend/build` exists
4. **CORS Errors**: Update CORS configuration for production domain
5. **Environment Variables**: Ensure all required variables are set

### Debug Commands:

```bash
# Check build locally
cd frontend && npm run build

# Test production build
NODE_ENV=production node app.js

# Check Docker build
docker build -t reqgenai .
docker run -p 8080:8080 reqgenai
```

## 📊 Monitoring

After deployment, monitor:
- Application logs
- Database connections
- API response times
- Error rates
- User activity

## 🔄 Updates

To update your deployed application:
1. Push changes to GitHub
2. Platform will auto-deploy (if configured)
3. Or manually trigger deployment
4. Test the updated version

---

**Need help?** Check the platform-specific documentation or create an issue in the repository.
