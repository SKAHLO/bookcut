# Vercel Deployment Checklist

## 🚀 Deployment Steps

### 1. Deploy to Vercel
- [ ] Deploy using GitHub integration or Vercel CLI
- [ ] Get your deployment URL (e.g., `https://your-app.vercel.app`)

### 2. Environment Variables (CRITICAL!)
Add these in Vercel Dashboard → Settings → Environment Variables:

```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
JWT_SECRET=your-jwt-secret-here
MONGODB_URI=your-mongodb-connection-string-here
NODE_ENV=production
```

**⚠️ Get actual values from your `.env.local` file**

### 3. Google OAuth Configuration
1. Go to [Google Console](https://console.developers.google.com/)
2. Select your project
3. Go to Credentials → OAuth 2.0 Client IDs
4. Click your Client ID
5. Add **Authorized JavaScript origins**:
   - `https://your-app.vercel.app`
   - `https://*.vercel.app` (for preview deployments)
6. Add **Authorized redirect URIs**:
   - `https://your-app.vercel.app`

### 4. Test Deployment
- [ ] Visit your Vercel URL
- [ ] Test Google sign-in buttons
- [ ] Check console for errors
- [ ] Test both Customer and Barber registration

### 5. Domain Setup (Optional)
- [ ] Add custom domain in Vercel dashboard
- [ ] Update Google OAuth with new domain

## 🔧 Troubleshooting

### Google Auth Issues:
1. Check environment variables are set correctly
2. Verify Google Console has correct domains
3. Check browser console for specific errors
4. Try incognito mode first

### Build Issues:
- Check build logs in Vercel dashboard
- Ensure all dependencies are in package.json
- Verify TypeScript compilation passes

### Database Issues:
- Test MongoDB connection string
- Ensure MongoDB allows connections from Vercel IPs
- Check database user permissions

## 🚨 Security Checklist
- [ ] No secrets committed to GitHub
- [ ] All environment variables set in Vercel only
- [ ] Google OAuth domains properly configured
- [ ] HTTPS enforced (automatic with Vercel)

## 📞 Support
If deployment fails, check:
1. Vercel build logs
2. Browser console errors
3. Network tab for failed requests
4. MongoDB Atlas connection logs
