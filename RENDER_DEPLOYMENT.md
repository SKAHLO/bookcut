# Render Deployment Guide

## 🚀 Render Deployment Steps

### 1. Service Configuration
```
Service Type: Web Service
Name: bookcut
Region: Oregon (US West)
Branch: tester
Runtime: Node
Build Command: npm install && npm run build
Start Command: npm start
```

### 2. Environment Variables (CRITICAL!)
Add these in Render Dashboard → Environment:

```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
JWT_SECRET=your-jwt-secret-here
MONGODB_URI=your-mongodb-connection-string-here
NODE_ENV=production
PORT=10000
```

**⚠️ Get actual values from your `.env.local` file**

### 3. Advanced Settings
```
Auto-Deploy: Yes
Health Check Path: /
```

### 4. Google OAuth Configuration
After deployment, get your Render URL (e.g., `https://bookcut.onrender.com`)

1. Go to [Google Console](https://console.developers.google.com/)
2. Select your project
3. Go to Credentials → OAuth 2.0 Client IDs
4. Click your Client ID
5. Add **Authorized JavaScript origins**:
   - `https://bookcut.onrender.com` (your actual URL)
   - `https://*.onrender.com` (for preview deployments)
6. Add **Authorized redirect URIs**:
   - `https://bookcut.onrender.com`

## 🔧 Render-Specific Configuration

### Build Settings
Render automatically detects Next.js and uses:
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Node Version**: Latest LTS

### Custom Build Script (if needed)
Create `render-build.sh` in project root:
```bash
#!/bin/bash
npm install
npm run build
```

Make it executable:
```bash
chmod +x render-build.sh
```

Then set Build Command to: `./render-build.sh`

### Dockerfile (Alternative)
If you need more control, create a `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

## 📊 Render vs Other Platforms

### Render Advantages:
- ✅ Simple deployment process
- ✅ Free tier available
- ✅ Automatic SSL certificates
- ✅ Built-in CI/CD
- ✅ Easy environment variable management
- ✅ Good for Next.js apps

### Render Limitations:
- ⚠️ Cold starts on free tier
- ⚠️ Limited build minutes on free tier
- ⚠️ Slower than Vercel for Next.js specifically

## 🚨 Important Notes

### Free Tier Limitations:
- Services sleep after 15 minutes of inactivity
- 750 hours per month (enough for 1 service)
- Cold start delays (10-30 seconds)

### Production Considerations:
- Use paid tier for production apps
- Set up custom domain
- Configure monitoring and alerts

## 🔍 Troubleshooting

### Build Failures:
1. Check build logs in Render dashboard
2. Ensure all dependencies in package.json
3. Verify build commands are correct

### Google Auth Issues:
1. Check environment variables are set
2. Verify Google OAuth domains
3. Check browser console for errors

### Database Connection:
1. Whitelist Render IPs in MongoDB Atlas
2. Test connection string locally first
3. Check MongoDB Atlas network access

## 🚀 Deploy Command Summary

1. **Connect Repository**: Link GitHub repo to Render
2. **Configure Service**: Set build/start commands
3. **Add Environment Variables**: Copy from .env.local
4. **Deploy**: Click "Create Web Service"
5. **Update Google OAuth**: Add Render URL to Google Console
6. **Test**: Visit your Render URL and test functionality
