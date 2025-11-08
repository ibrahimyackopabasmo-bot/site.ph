# Deploy to Render - Step by Step Guide

## Prerequisites
- GitHub account
- Render account (sign up at https://render.com)
- Your code is already pushed to GitHub: https://github.com/ibrahimyackopabasmo-bot/site.ph.git

## Deployment Steps

### 1. Create a Render Account
1. Go to https://render.com
2. Sign up for a free account (you can use GitHub to sign in)
3. Verify your email if required

### 2. Create a New Web Service
1. In your Render dashboard, click **"New +"** button
2. Select **"Web Service"**
3. Connect your GitHub account if not already connected
4. Select the repository: **`ibrahimyackopabasmo-bot/site.ph`**

### 3. Configure the Service
Use these settings:

**Basic Settings:**
- **Name**: `phonix-printer` (or any name you prefer)
- **Region**: Choose the closest region to your users
- **Branch**: `main`
- **Root Directory**: (leave empty)
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

**Advanced Settings:**
- **Environment**: `Node`
- **Node Version**: `18` or `20` (LTS)
- **Auto-Deploy**: `Yes` (automatically deploys when you push to GitHub)

**Environment Variables:**
Add these if needed:
- `PORT` = `3000` (Render will set this automatically, but you can set it)
- `NODE_ENV` = `production`

### 4. Deploy
1. Click **"Create Web Service"**
2. Render will start building your application
3. Wait for the deployment to complete (usually 2-5 minutes)
4. Your website will be live at: `https://your-app-name.onrender.com`

### 5. Custom Domain (Optional)
1. Go to your service settings
2. Click on **"Custom Domains"**
3. Add your domain name
4. Follow the DNS configuration instructions

## Important Notes

### Video Files
- Your video files are in the repository
- They will be served from Render's CDN
- Make sure videos are optimized for web (compressed)

### Environment Variables
If you need to set environment variables (like Telegram bot token):
1. Go to your service settings
2. Click **"Environment"**
3. Add your variables (never commit secrets to GitHub!)

### Auto-Deploy
- Every time you push to the `main` branch, Render will automatically deploy
- You can disable this in settings if needed

### Free Tier Limits
- Render free tier has some limits:
  - Service may spin down after 15 minutes of inactivity
  - First request after spin-down may be slow (cold start)
  - 750 hours of runtime per month (enough for one service 24/7)

### Upgrading (Optional)
- For 24/7 uptime without spin-down, consider the paid plan
- Free tier is perfect for testing and small websites

## Troubleshooting

### Build Fails
- Check the build logs in Render dashboard
- Make sure `package.json` has all dependencies
- Verify Node version is compatible

### Service Won't Start
- Check the logs in Render dashboard
- Verify `startCommand` is correct: `npm start`
- Make sure `server.js` is in the root directory

### Videos Not Loading
- Check file paths in HTML
- Verify video files are in the repository
- Check browser console for errors

## Next Steps

1. ✅ Code is pushed to GitHub
2. ✅ Create Render account
3. ✅ Create Web Service
4. ✅ Configure settings
5. ✅ Deploy
6. ✅ Test your website
7. ✅ Share your Render URL

## Support

If you encounter issues:
- Check Render documentation: https://render.com/docs
- Check build logs in Render dashboard
- Verify all files are committed to GitHub

---

**Your Website URL will be**: `https://phonix-printer.onrender.com` (or your chosen name)

Good luck with your deployment! 🚀

