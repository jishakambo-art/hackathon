# Railway Backend Deployment Guide

## What Was Fixed

### 1. Nixpacks Configuration
- Created [backend/nixpacks.toml](backend/nixpacks.toml) for proper dependency management
- Removed `apt-get` commands (not compatible with Nixpacks)
- Added Xvfb and Playwright system dependencies via Nix packages

### 2. Simplified Railway Config
- Updated [backend/railway.json](backend/railway.json) to use Nixpacks defaults
- Removed manual build commands (handled by nixpacks.toml)
- Start command now managed by nixpacks.toml

### 3. Build Optimization
- Added [.railwayignore](backend/.railwayignore) to exclude unnecessary files
- Reduced build size and deployment time

## Deploy to Railway

### Step 1: Create Railway Project

1. **Go to Railway**: https://railway.app/new
2. **Deploy from GitHub**:
   - Click "Deploy from GitHub repo"
   - Select your repository: `jishakambo-art/hackathon`
   - Click "Deploy Now"

### Step 2: Configure Service

1. **Set Root Directory**:
   - Click on the service
   - Settings → Root Directory: `backend`

2. **Add Environment Variables** (CRITICAL):
   Click "Variables" tab and add:

   ```bash
   # Supabase (from your Supabase dashboard)
   SUPABASE_URL=https://ykkjvvntrhujzdzthxfb.supabase.co
   SUPABASE_ANON_KEY=sb_publishable_0rdUjYIQwTPtnWkMxOTZ4g_iXMWC_id
   SUPABASE_SERVICE_KEY=your-service-key-here

   # Perplexity (your API key)
   PERPLEXITY_API_KEY=your-perplexity-api-key

   # App Config
   SECRET_KEY=your-random-secret-key-minimum-32-chars
   FRONTEND_URL=https://your-app.vercel.app

   # NotebookLM - MUST be "true" for production
   BROWSER_HEADLESS=true

   # Substack (optional - demo mode works without)
   SUBSTACK_CLIENT_ID=demo-client-id
   SUBSTACK_CLIENT_SECRET=demo-client-secret
   SUBSTACK_REDIRECT_URI=http://localhost:8000/auth/substack/callback
   ```

3. **Generate SECRET_KEY** (if needed):
   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

### Step 3: Add Persistent Volume (IMPORTANT)

To preserve NotebookLM credentials across deployments:

1. Go to your Railway service → **Volumes**
2. Click "New Volume"
3. **Mount Path**: `/app/.notebooklm_credentials`
4. **Size**: 1GB (minimum)
5. Click "Add Volume"

This ensures user credentials persist even when the container restarts.

### Step 4: Deploy

Railway will automatically:
1. Detect nixpacks.toml
2. Install Python 3.12
3. Install Xvfb (virtual display server)
4. Install Playwright + Chromium
5. Install Python dependencies
6. Start the server with Xvfb running

**Expected build time**: 3-5 minutes (first deploy is slower)

### Step 5: Get Your Railway URL

1. After deployment, go to your service
2. Click on "Settings" → "Networking"
3. Click "Generate Domain"
4. Copy your public URL: `https://your-backend.up.railway.app`

### Step 6: Update Vercel Frontend

Now update your Vercel frontend environment variable:

1. Go to Vercel dashboard
2. Your project → Settings → Environment Variables
3. Update `NEXT_PUBLIC_API_URL` to your Railway URL
4. Redeploy frontend (Vercel will auto-redeploy if connected to GitHub)

### Step 7: Update Backend CORS

Update [backend/app/main.py](backend/app/main.py) to include your Vercel domain:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-app.vercel.app",  # Add your Vercel URL
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Push to GitHub, Railway will auto-redeploy.

## How It Works

### Build Process (nixpacks.toml)

```toml
[phases.setup]
nixPkgs = ["python312", "xorg.xvfb"]  # Install system packages
aptPkgs = [...]  # Playwright browser dependencies

[phases.install]
cmds = [
    "pip install -r requirements.txt",   # Python deps
    "playwright install chromium",       # Browser binary
    "playwright install-deps chromium"   # Browser deps
]

[start]
cmd = "Xvfb + uvicorn"  # Start virtual display + server
```

### Runtime Process

1. **Xvfb starts** on display `:99` (virtual screen)
2. **DISPLAY env var** set to `:99`
3. **Playwright** launches Chromium on virtual display
4. **Users authenticate** via browser automation (server-side)
5. **Credentials stored** in persistent volume

## Monitoring & Debugging

### View Logs

Railway Dashboard → Your Service → Deployments → View Logs

Look for:
- ✅ `Xvfb` started successfully
- ✅ `Playwright` browser installed
- ✅ Server running on port `$PORT`
- ✅ Health check passing at `/health`

### Common Issues

#### Build Fails: "Command not found: playwright"

**Cause**: Playwright not installed properly

**Fix**: Check that `playwright>=1.40.0` is in requirements.txt

#### Health Check Timeout

**Cause**: Build takes too long, health check times out

**Fix**: Already set to 300s in railway.json, but you can increase further:
```json
"healthcheckTimeout": 600
```

#### "Cannot open display :99"

**Cause**: Xvfb not running

**Fix**: Check nixpacks.toml has `xorg.xvfb` in nixPkgs

#### Credentials Lost After Restart

**Cause**: No persistent volume

**Fix**: Add Railway Volume mounted at `/app/.notebooklm_credentials`

#### CORS Errors

**Cause**: Frontend URL not in CORS origins

**Fix**: Update `FRONTEND_URL` env var and restart service

## Test the Deployment

### 1. Check Health Endpoint

```bash
curl https://your-backend.up.railway.app/health
# Should return: {"status":"healthy"}
```

### 2. Check API Root

```bash
curl https://your-backend.up.railway.app/
# Should return: {"message":"DailyBrief API","status":"running"}
```

### 3. Test from Frontend

Visit your Vercel app and:
- [ ] Add an RSS feed
- [ ] Add a news topic
- [ ] Visit NotebookLM page
- [ ] Click "Connect with Google"
- [ ] Complete authentication
- [ ] Click "Generate Now"
- [ ] Check generation status

## Environment Variables Summary

| Variable | Required | Example | Where to Get |
|----------|----------|---------|--------------|
| `SUPABASE_URL` | Yes | https://xxx.supabase.co | Supabase dashboard |
| `SUPABASE_ANON_KEY` | Yes | eyJ... | Supabase dashboard → API |
| `SUPABASE_SERVICE_KEY` | Yes | eyJ... | Supabase dashboard → API |
| `PERPLEXITY_API_KEY` | Yes | pplx-... | Perplexity dashboard |
| `SECRET_KEY` | Yes | random-32-chars | Generate with Python |
| `FRONTEND_URL` | Yes | https://yourapp.vercel.app | Your Vercel URL |
| `BROWSER_HEADLESS` | Yes | true | Must be "true" |
| `SUBSTACK_CLIENT_ID` | No | demo-client-id | Optional (for OAuth) |
| `SUBSTACK_CLIENT_SECRET` | No | demo-client-secret | Optional (for OAuth) |

## Cost Estimate

**Railway Pricing**:
- **Hobby Plan**: $5/month + usage
  - 500 hours of execution time
  - $0.000231/GB-hour for memory
  - $0.000463/vCPU-hour
  - 100GB outbound data

**For this app** (light usage):
- Estimated: $10-15/month
- Includes persistent volume storage

**Tip**: Set up billing alerts in Railway to monitor costs.

## Scheduled Generation (Daily Cron)

Once deployed, set up scheduled generation:

### Option 1: Railway Cron Jobs (Coming Soon)

Railway is adding native cron support. When available:

```json
{
  "cron": {
    "schedule": "0 14 * * *",
    "command": "python -m app.scripts.run_daily_generation"
  }
}
```

### Option 2: GitHub Actions (Free)

Create `.github/workflows/daily-generation.yml`:

```yaml
name: Daily Podcast Generation

on:
  schedule:
    - cron: '0 14 * * *'  # 7am PT = 2pm UTC
  workflow_dispatch:  # Manual trigger

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger generation
        run: |
          curl -X POST ${{ secrets.BACKEND_URL }}/generate/scheduled \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

Add secrets to GitHub:
- `BACKEND_URL`: Your Railway URL
- `CRON_SECRET`: A secret token for authentication

### Option 3: External Cron Service

Use a service like:
- **cron-job.org** (free)
- **EasyCron** (free tier)
- **Uptime Robot** (free monitoring + HTTP calls)

Set up a daily HTTP POST to: `https://your-backend.up.railway.app/generate/scheduled`

## Next Steps

After successful deployment:

1. ✅ Test authentication flow end-to-end
2. ✅ Generate first podcast manually
3. ✅ Verify podcast appears in NotebookLM
4. ✅ Set up scheduled generation (7am daily)
5. ✅ Monitor Railway logs for first few days
6. ✅ Set up billing alerts
7. ✅ Share with friends for testing

## Support & Troubleshooting

- **Railway Docs**: https://docs.railway.app
- **Nixpacks Docs**: https://nixpacks.com
- **Playwright Docs**: https://playwright.dev

If deployment fails:
1. Check Railway build logs for specific errors
2. Verify all environment variables are set
3. Ensure persistent volume is mounted
4. Test build locally with Docker (optional)

---

**Your backend is ready to deploy!** Follow the steps above and you'll be live in ~10 minutes.
