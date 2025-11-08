# 🔧 Render Deployment Troubleshooting Guide

## If You See "Not Found" Error

### Step 1: Check Render Build Logs

1. Go to your Render dashboard: https://dashboard.render.com
2. Click on your service (`phonix-printer`)
3. Click on **"Logs"** tab
4. Look for errors in the build or runtime logs

### Step 2: Check if Server is Starting

Look for these messages in the logs:
```
🚀 Server is running on http://0.0.0.0:XXXX
📍 Environment: production
📁 Working directory: /opt/render/project/src
📄 HTML files available: index.html, mywork.html, ...
```

**If you DON'T see these messages**, the server isn't starting. Check for:
- Build errors
- Missing dependencies
- Port binding issues

### Step 3: Test the Server

1. Go to: `https://phonix-printer.onrender.com/test`
2. You should see a JSON response like:
   ```json
   {
     "status": "ok",
     "message": "Server is running!",
     "htmlFiles": ["index.html", "mywork.html", ...],
     "indexExists": true
   }
   ```

**If `/test` works but `/` doesn't:**
- The server is running but `index.html` might not be in the right location
- Check the `htmlFiles` array in the test response
- Verify files are in the repository

**If `/test` doesn't work:**
- The server isn't starting at all
- Check build logs for errors
- Verify `package.json` and `server.js` are correct

### Step 4: Common Issues and Fixes

#### Issue 1: Build Fails
**Symptoms:** Build logs show errors
**Fix:**
- Check that all dependencies are in `package.json`
- Verify Node.js version is compatible (18+)
- Check for syntax errors in `server.js`

#### Issue 2: Server Starts But Shows "Not Found"
**Symptoms:** Server logs show it's running, but website shows "Not Found"
**Fix:**
- Check that `index.html` exists in the repository
- Verify file paths in `server.js` are correct
- Check the `/test` endpoint to see what files are available

#### Issue 3: Port Binding Error
**Symptoms:** Logs show port binding errors
**Fix:**
- Render automatically sets the PORT environment variable
- Make sure `server.js` uses `process.env.PORT || 3000`
- Verify server listens on `0.0.0.0` (not `localhost`)

#### Issue 4: Files Not Found
**Symptoms:** Server runs but files don't load
**Fix:**
- Check that all HTML files are committed to GitHub
- Verify files are in the root directory (not in a subdirectory)
- Check the `/test` endpoint to see available files

### Step 5: Verify Render Configuration

In Render dashboard, verify:

1. **Build Command**: `npm install`
2. **Start Command**: `npm start`
3. **Environment**: `Node`
4. **Node Version**: `18` or `20` (LTS)

### Step 6: Check Repository

Verify these files are in your GitHub repository:
- ✅ `server.js`
- ✅ `package.json`
- ✅ `index.html`
- ✅ `mywork.html`
- ✅ `styles.css`
- ✅ `script.js`
- ✅ All images and videos

### Step 7: Manual Deployment

If auto-deploy isn't working:

1. In Render dashboard, click **"Manual Deploy"**
2. Select **"Deploy latest commit"**
3. Wait for deployment to complete
4. Check logs for any errors

## Quick Diagnostic Checklist

- [ ] Server logs show "Server is running"
- [ ] `/test` endpoint returns JSON
- [ ] `/test` shows `indexExists: true`
- [ ] All HTML files are in the repository
- [ ] Build completes without errors
- [ ] Port is set correctly (Render sets it automatically)
- [ ] Server listens on `0.0.0.0`

## Still Having Issues?

1. **Check Render Logs** - Most issues are visible in the logs
2. **Test `/test` endpoint** - This shows what the server can see
3. **Verify file paths** - Make sure files are in the root directory
4. **Check GitHub repository** - Ensure all files are committed and pushed
5. **Review server.js** - Make sure routes are defined correctly

## Contact Support

If none of these steps work:
1. Copy the full error message from Render logs
2. Check the `/test` endpoint response
3. Verify all files are in the GitHub repository
4. Review the build and runtime logs carefully

---

**Remember:** The `/test` endpoint is your friend! It shows exactly what the server can see and helps diagnose issues quickly.

