# Setting Up Daily Generation Cron Job

This guide explains how to set up automated daily podcast generation using a cron job on Railway.

## Overview

The daily generation feature works by:
1. Users configure their schedule in the web app (time + timezone)
2. A cron job runs every minute and checks if any users are due for generation
3. For matching users, podcasts are generated automatically using their configured sources

## Backend Endpoint

The cron job should hit this endpoint:
```
POST https://your-railway-app.up.railway.app/generate/cron/daily-generation
```

## Option 1: Railway Cron Job (Recommended)

Railway supports cron jobs natively. Here's how to set it up:

### Step 1: Create a Cron Service

1. Go to your Railway dashboard
2. Click "New" → "Empty Service"
3. Name it "DailyBrief Cron"

### Step 2: Configure the Cron Schedule

1. In the cron service settings, set the schedule:
   ```
   */1 * * * *
   ```
   This runs every minute to check for due generations.

2. Set the command to run:
   ```bash
   curl -X POST https://your-railway-app.up.railway.app/generate/cron/daily-generation
   ```

3. Replace `your-railway-app.up.railway.app` with your actual Railway domain

### Step 3: Add Security (Optional but Recommended)

To prevent unauthorized access to the cron endpoint:

1. Add a `CRON_SECRET` environment variable to your main backend service
2. Update the curl command to include the secret:
   ```bash
   curl -X POST https://your-railway-app.up.railway.app/generate/cron/daily-generation \
     -H "X-Cron-Secret: your-secret-here"
   ```
3. Update the backend code to validate the secret (code already prepared in generation.py)

## Option 2: External Cron Service

If Railway doesn't support cron jobs in your plan, use an external service:

### Using cron-job.org (Free)

1. Go to https://cron-job.org
2. Create a free account
3. Create a new cron job:
   - **URL**: `https://your-railway-app.up.railway.app/generate/cron/daily-generation`
   - **Method**: POST
   - **Schedule**: Every 1 minute (`*/1 * * * *`)
   - **Timezone**: UTC (scheduler handles timezone conversion)

### Using EasyCron

1. Go to https://www.easycron.com
2. Create a free account
3. Add a cron job with same settings as above

## Option 3: GitHub Actions (Free Alternative)

Create a GitHub Actions workflow that runs every minute:

### Step 1: Create Workflow File

Create `.github/workflows/daily-generation-cron.yml`:

```yaml
name: Daily Podcast Generation Cron

on:
  schedule:
    # Runs every minute
    - cron: '*/1 * * * *'
  workflow_dispatch: # Allows manual triggering

jobs:
  trigger-generation:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Daily Generation Check
        run: |
          curl -X POST https://your-railway-app.up.railway.app/generate/cron/daily-generation \
            -H "X-Cron-Secret: ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json"
```

### Step 2: Add Secret

1. Go to your GitHub repository settings
2. Navigate to "Secrets and variables" → "Actions"
3. Add a new secret named `CRON_SECRET`
4. Use the same value as your Railway `CRON_SECRET` env variable

### Step 3: Enable Actions

1. Go to the "Actions" tab in your repository
2. Enable GitHub Actions if not already enabled
3. The workflow will start running automatically

## Verifying the Cron Job

### Check Logs

1. **Railway Logs**: Check your backend service logs for `[SCHEDULER]` messages
2. **Expected Output**:
   ```
   [SCHEDULER] Checking 5 users with daily generation enabled
   [SCHEDULER] User abc123 is due for generation
   [SCHEDULER] Generating podcasts for 1 users
   [SCHEDULER] Generation completed for user abc123
   ```

### Test Manually

You can test the endpoint directly:

```bash
curl -X POST https://your-railway-app.up.railway.app/generate/cron/daily-generation
```

Expected response:
```json
{
  "status": "success",
  "timestamp": "2024-01-15T10:30:00Z",
  "checked": 5,
  "generated": 1,
  "users": ["user-id-1"]
}
```

## Testing the Schedule Feature

### Test with a Near-Future Time

1. Go to https://custompodcast.vercel.app/schedule
2. Enable daily generation
3. Set time to 1-2 minutes in the future
4. Select your timezone
5. Save
6. Wait for the scheduled time
7. Check Railway logs for generation activity
8. Check your generations page for the new podcast

### Test the Scheduler Logic

You can test the scheduler locally:

```bash
cd backend
python -c "
from app.services.scheduler import check_and_generate_for_all_users
import asyncio
result = asyncio.run(check_and_generate_for_all_users())
print(result)
"
```

## Troubleshooting

### Cron Job Not Running

1. **Check cron syntax**: Verify the schedule expression
2. **Check URL**: Ensure the Railway domain is correct
3. **Check service status**: Make sure your Railway app is running
4. **Check quotas**: Some services have limits on free-tier cron jobs

### Generations Not Triggering

1. **Check user preferences**: Verify users have `daily_generation_enabled=true`
2. **Check timezone**: Ensure timezone is correctly set
3. **Check time matching**: The scheduler matches exact minute (within 1-minute window)
4. **Check sources**: Users need at least one enabled source (RSS, Substack, or Topics)
5. **Check NotebookLM**: Users must have NotebookLM credentials uploaded

### Multiple Generations Triggering

If generations are triggering multiple times per minute:
1. The cron job might be running more frequently than every minute
2. Check cron service logs to see actual trigger frequency
3. Consider adding rate limiting to the endpoint

## Environment Variables

Make sure these are set in Railway:

```bash
# Required for daily generation
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
FRONTEND_URL=https://custompodcast.vercel.app

# Optional for cron security
CRON_SECRET=your-secret-key
```

## Database Migration

Don't forget to run the migration to add scheduling fields:

1. Go to Supabase SQL Editor
2. Run the migration from `backend/migrations/add_daily_generation_schedule.sql`

This adds:
- `daily_generation_enabled` column (boolean, default false)
- `generation_time` column (time, default 07:00:00)

## Cost Considerations

- **Railway**: Free tier includes cron jobs (check current limits)
- **GitHub Actions**: 2000 minutes/month on free tier
  - Running every minute = ~1440 minutes/day (will exceed free tier)
  - Consider reducing frequency if using GitHub Actions
- **External Cron Services**: Free tiers typically allow frequent executions

## Recommended Setup

For production:
1. Use Railway native cron if available (simplest)
2. Otherwise, use cron-job.org or similar service (reliable, free)
3. Add `CRON_SECRET` for security
4. Monitor logs for the first few days
5. Set up alerts for failed generations (optional)

## Next Steps

After setting up the cron job:
1. Test with a user account
2. Monitor logs for 24 hours
3. Verify generations are created at correct times
4. Check NotebookLM for generated podcasts
5. Adjust scheduling frequency if needed (currently every minute)

---

**Note**: The scheduler is designed to handle multiple users in parallel, so one user's slow generation won't block others.
