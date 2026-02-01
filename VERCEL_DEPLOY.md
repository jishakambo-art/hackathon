# Vercel Frontend Deployment Guide

## What Was Fixed

### 1. Suspense Boundary Issue
- Added Suspense wrapper to [sources/substack/page.tsx](frontend/src/app/sources/substack/page.tsx) for `useSearchParams()`
- Next.js requires Suspense for client-side search params

### 2. Hardcoded Localhost URLs
- Updated [next.config.js](frontend/next.config.js) to use `NEXT_PUBLIC_API_URL` environment variable
- Updated Substack connection URLs to use API_URL variable

### 3. Build Validation
- Build now completes successfully with no errors
- All pages compile and render properly

## Deploy to Vercel

### Option 1: Vercel Dashboard (Recommended)

1. **Go to Vercel**: https://vercel.com/new
2. **Import Repository**: Connect your GitHub repo
3. **Configure Project**:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Next.js (auto-detected)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)

4. **Environment Variables** (IMPORTANT - Add these):
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.railway.app
   NEXT_PUBLIC_SUPABASE_URL=https://ykkjvvntrhujzdzthxfb.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_0rdUjYIQwTPtnWkMxOTZ4g_iXMWC_id
   ```

5. **Deploy**: Click "Deploy"

### Option 2: Vercel CLI

```bash
cd frontend

# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# When prompted:
# - Set up and deploy? Y
# - Which scope? (your account)
# - Link to existing project? N
# - Project name? dailybrief-frontend
# - Directory? ./
# - Override settings? N

# Then add environment variables in dashboard
```

## Environment Variables Explained

### Required for Production:
- `NEXT_PUBLIC_API_URL` - Your Railway backend URL (e.g., https://dailybrief-backend.up.railway.app)
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key (safe for frontend)

### Where to Find These:
1. **Railway Backend URL**:
   - Deploy backend first to Railway
   - Copy the public URL from Railway dashboard
   - Format: `https://[project-name].up.railway.app`

2. **Supabase Credentials**:
   - Go to Supabase project settings
   - API section
   - Copy Project URL and anon/public key

## After Deployment

### 1. Update Backend CORS
Once you have your Vercel URL, update backend CORS settings:

Edit [backend/app/main.py](backend/app/main.py):
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-app.vercel.app",  # Add your Vercel URL here
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Then redeploy backend to Railway.

### 2. Test the Deployment
Visit your Vercel URL and test:
- [ ] Dashboard loads
- [ ] Can add RSS feeds
- [ ] Can add news topics
- [ ] NotebookLM connection page works
- [ ] Generate button appears

### 3. Common Issues

**CORS Errors**:
- Make sure backend CORS includes your Vercel domain
- Check that `NEXT_PUBLIC_API_URL` is set correctly

**API Connection Failed**:
- Verify `NEXT_PUBLIC_API_URL` has no trailing slash
- Ensure Railway backend is running and accessible
- Check Railway logs for errors

**Build Fails**:
- Ensure all dependencies are in package.json
- Check Vercel build logs for specific errors
- Verify Node.js version compatibility (18+)

## Local Testing Before Deploy

Test the production build locally:

```bash
cd frontend

# Set production API URL temporarily
export NEXT_PUBLIC_API_URL=http://localhost:8000

# Build
npm run build

# Start production server
npm start

# Visit http://localhost:3000
```

## Automatic Deployments

Once connected to GitHub:
- Every push to `main` branch triggers a production deployment
- Pull requests get preview deployments
- View deployment status in Vercel dashboard

## Cost

Vercel Hobby tier is **FREE** and includes:
- Unlimited personal projects
- HTTPS with custom domains
- Global CDN
- 100GB bandwidth/month
- Serverless Functions

Perfect for this project!

## Next Steps

After frontend is deployed:
1. Deploy backend to Railway (see [Railway deployment guide](PRODUCTION_DEPLOYMENT.md))
2. Update backend CORS with Vercel URL
3. Test end-to-end flow
4. Set up scheduled cron job for daily generation
