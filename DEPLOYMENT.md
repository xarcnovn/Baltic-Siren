# 🚀 Deployment Guide - Netlify

This guide will help you deploy Baltic Siren to Netlify with secure API key handling.

## ✅ What's Been Done

Your code is now ready for Netlify deployment with:
- ✅ Serverless functions to protect API keys
- ✅ Updated frontend to use serverless functions
- ✅ Netlify configuration file
- ✅ Environment variable template

## 📋 Deployment Steps

### 1. Push to GitHub

First, commit and push all changes to your GitHub repository:

```bash
# Add all changes
git add .

# Commit
git commit -m "Add Netlify deployment with serverless functions"

# Push to GitHub
git push origin main
```

### 2. Deploy to Netlify

#### Option A: Connect via Netlify Dashboard (Recommended)

1. Go to [netlify.com](https://netlify.com) and sign up/login
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **GitHub** and authorize Netlify
4. Select your `Baltic_Siren` repository
5. Netlify will auto-detect settings from `netlify.toml`
6. Click **"Deploy site"**

#### Option B: Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod
```

### 3. Add Environment Variables

After deployment, add your API keys:

1. Go to your site in Netlify dashboard
2. Navigate to **Site settings** → **Environment variables**
3. Click **"Add a variable"** and add the following:

   **First variable:**
   - **Key**: `DATALASTIC_VESSELS_API`
   - **Value**: Your Datalastic API key (from `.env` file)

   **Second variable:**
   - **Key**: `MAPBOX_ACCESS_TOKEN`
   - **Value**: Your Mapbox access token (from `.env` file)

4. Click **"Save"**
5. **Important**: Go to **Deploys** → **Trigger deploy** → **Deploy site**
   (Environment variables require a redeploy to take effect)

### 4. Optional: Secure Your Mapbox Token with URL Restrictions

For additional security, you can restrict your Mapbox token to your domain:

1. Go to [mapbox.com/account/access-tokens](https://account.mapbox.com/access-tokens)
2. Click on your token
3. Under **Token restrictions** → **URL restrictions**
4. Add your Netlify URL: `https://your-site-name.netlify.app`
5. Save

Now your Mapbox token only works on your domain!

## 🔍 Testing Your Deployment

Once deployed:

1. Visit your Netlify URL: `https://your-site-name.netlify.app`
2. Test vessel tracking:
   - Select a vessel from the list
   - Click **"📍 TRACK THIS VESSEL"**
   - Wait for position update
3. Check API usage:
   - Click ⚙️ (settings icon)
   - Click **"🔄 REFRESH USAGE"**
   - Should show your API usage stats

## 🐛 Troubleshooting

### Vessels Not Tracking

**Problem**: "API key not configured" error

**Solution**:
- Check environment variables are set in Netlify
- Make sure you triggered a redeploy after adding variables

### Functions Not Found (404)

**Problem**: `/api/get-vessel` returns 404

**Solution**:
- Check `netlify.toml` exists in repository root
- Verify `netlify/functions/` directory is pushed to GitHub
- Check Netlify build logs for function deployment

### Local Testing

To test serverless functions locally:

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Run local dev server
netlify dev

# Visit http://localhost:8888
```

Make sure to create a `.env` file locally (copy from `.env.example`).

## 📊 What Changed

### Files Created:
- `netlify.toml` - Netlify configuration
- `netlify/functions/get-vessel.js` - Vessel data proxy
- `netlify/functions/get-usage.js` - API usage proxy
- `netlify/functions/get-config.js` - Configuration proxy (Mapbox token)
- `.env.example` - Environment variable template
- `.env` - Local environment variables (gitignored)

### Files Modified:
- `app/js/tracker.js` - Updated to use serverless functions
- `app/index.html` - Updated to fetch Mapbox token from serverless function
- `scrappers/enrich_positions.js` - Updated to use environment variables

### Security Improvements:
- ✅ Datalastic API key now server-side only
- ✅ Mapbox access token now server-side only
- ✅ Never exposed to browser/users
- ✅ Can rotate keys without code changes
- ✅ API calls proxied through your domain
- ✅ All secrets stored in environment variables

## 🎉 You're Done!

Your Baltic Siren app is now deployed with secure API key handling!

**Your app URL**: Check Netlify dashboard for your site URL

**Next steps**:
- Share your deployment URL
- Monitor API usage in Netlify function logs
- Consider adding a custom domain
