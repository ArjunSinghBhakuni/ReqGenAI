# 🚀 Vercel Deployment Guide for ReqGenAI

## 📋 Pre-Deployment Steps

### 1. **Prepare Your Repository**

- ✅ All code is committed to GitHub
- ✅ `vercel.json` is configured
- ✅ Frontend API config updated for production

### 2. **Set Up MongoDB Atlas** (Required)

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account
3. Create a new cluster
4. Create a database user
5. Get your connection string
6. Whitelist all IPs (0.0.0.0/0) for Vercel

### 3. **Deploy to Vercel**

#### **Option A: Vercel Dashboard (Recommended)**

1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login with GitHub
3. Click "New Project"
4. Import your GitHub repository
5. Vercel will auto-detect the configuration

#### **Option B: Vercel CLI**

```bash
npm install -g vercel
vercel login
vercel
```

## 🔧 Environment Variables Setup

In your Vercel dashboard, go to **Settings > Environment Variables** and add:

### **Required Variables:**

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/reqgenai
NODE_ENV=production
```

### **Optional Variables (if using N8N):**

```
N8N_REQUIREMENT_EXTRACTION_URL=https://your-n8n-instance.com/webhook/extract
N8N_BRD_GENERATION_URL=https://your-n8n-instance.com/webhook/brd
N8N_REQUIREMENT_BLUEPRINT_URL=https://your-n8n-instance.com/webhook/blueprint
```

### **Frontend Variables (optional):**

```
REACT_APP_API_URL=/api
```

## 🚀 Deployment Process

### **Step 1: Initial Deployment**

1. Vercel will automatically build your project
2. Frontend will be built using `npm run build`
3. Backend will be deployed as a serverless function
4. You'll get a URL like `https://your-app.vercel.app`

### **Step 2: Test Your Deployment**

1. **Health Check**: `https://your-app.vercel.app/health`
2. **API Docs**: `https://your-app.vercel.app/`
3. **Frontend**: `https://your-app.vercel.app/`
4. **Create Project**: Test manual project creation
5. **Webhook**: Test email processing webhook

### **Step 3: Custom Domain (Optional)**

1. Go to **Settings > Domains**
2. Add your custom domain
3. Update DNS records as instructed

## 🔄 Automatic Deployments

Vercel will automatically deploy when you:

- Push to main branch
- Create a pull request
- Merge a pull request

## 🧪 Testing Checklist

After deployment, test these features:

### **Backend API:**

- [ ] Health check endpoint
- [ ] Project creation (manual input)
- [ ] Project listing
- [ ] Document generation
- [ ] PDF generation
- [ ] Webhook endpoints

### **Frontend:**

- [ ] Dashboard loads
- [ ] Project creation form
- [ ] Project detail pages
- [ ] Document tabs (Requirements, BRD, Blueprint)
- [ ] Generate buttons
- [ ] Refresh functionality
- [ ] Notifications

### **Integration:**

- [ ] Email webhook processing
- [ ] N8N webhook calls (if configured)
- [ ] File uploads
- [ ] PDF downloads

## 🚨 Troubleshooting

### **Common Issues:**

1. **Build Fails**

   - Check Node.js version (use 18+)
   - Verify all dependencies are in package.json
   - Check build logs in Vercel dashboard

2. **MongoDB Connection Issues**

   - Verify connection string format
   - Check IP whitelist (add 0.0.0.0/0)
   - Verify database user permissions

3. **API Routes Not Working**

   - Check vercel.json configuration
   - Verify route patterns
   - Check function logs in Vercel dashboard

4. **Frontend Not Loading**
   - Check if frontend build completed
   - Verify static file serving
   - Check browser console for errors

### **Debug Commands:**

```bash
# Test build locally
cd frontend && npm run build

# Test production build
NODE_ENV=production node app.js

# Check Vercel logs
vercel logs
```

## 📊 Monitoring

Monitor your deployment:

- **Vercel Dashboard**: View deployments, logs, analytics
- **Function Logs**: Check serverless function execution
- **Analytics**: Monitor performance and usage
- **Error Tracking**: Set up error monitoring

## 🔄 Updates

To update your deployment:

1. Push changes to GitHub
2. Vercel automatically deploys
3. Test the new version
4. Rollback if needed (Vercel keeps previous deployments)

## 💡 Pro Tips

1. **Use Preview Deployments**: Test changes in PRs before merging
2. **Environment Variables**: Use different values for preview/production
3. **Custom Domains**: Set up your own domain for production
4. **Analytics**: Enable Vercel Analytics for insights
5. **Edge Functions**: Consider using Edge Functions for better performance

---

**Your app will be live at**: `https://your-app-name.vercel.app`

**Need help?** Check Vercel documentation or create an issue in your repository.
