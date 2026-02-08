# Google Sign In Setup Guide

## ✅ What's Been Implemented

Authentication has been fully implemented in the codebase:
- ✅ Backend JWT validation
- ✅ Frontend auth context and login page
- ✅ Protected routes
- ✅ Bearer token authentication

## 🔧 Supabase Configuration Required

To enable Google Sign In, you need to configure it in your Supabase project:

### Step 1: Get Google OAuth Credentials

1. Go to **Google Cloud Console**: https://console.cloud.google.com/
2. Create a new project or select existing
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth client ID**
5. Application type: **Web application**
6. Add authorized redirect URIs:
   ```
   https://ykkjvvntrhujzdzthxfb.supabase.co/auth/v1/callback
   ```
7. Copy your **Client ID** and **Client Secret**

### Step 2: Configure Supabase

1. Go to **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project: `ykkjvvntrhujzdzthxfb`
3. Go to **Authentication** → **Providers**
4. Find **Google** and click **Enable**
5. Paste your **Client ID** and **Client Secret** from Step 1
6. Click **Save**

### Step 3: Add Redirect URLs

In Supabase **Authentication** → **URL Configuration**:

Add these redirect URLs:
```
https://custompodcast.vercel.app/auth/callback
http://localhost:3000/auth/callback
```

### Step 4: Test Authentication

1. Visit https://custompodcast.vercel.app/login
2. Click "Sign in with Google"
3. Complete Google OAuth flow
4. You should be redirected to the dashboard

## 🔐 How Authentication Works Now

### Before (Demo Mode):
```
User makes API request
  → Backend returns demo-user-id-12345
  → No actual authentication
  → All users share same data
```

### After (Real Auth):
```
User signs in with Google
  → Supabase creates JWT token
  → Frontend stores session
  → API requests include: Authorization: Bearer <token>
  → Backend validates JWT with Supabase
  → Returns actual user ID
  → Each user has isolated data
```

## 🔄 Auth Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│  1. User clicks "Sign in with Google"                   │
│     https://custompodcast.vercel.app/login             │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  2. Supabase redirects to Google OAuth                  │
│     https://accounts.google.com/o/oauth2/auth           │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  3. User authorizes with Google                         │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  4. Google redirects to Supabase callback               │
│     https://ykkjvvntrhujzdzthxfb.supabase.co/auth/v1/callback
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  5. Supabase creates session & JWT token                │
│     Redirects to: /auth/callback                        │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  6. Frontend stores session in localStorage             │
│     Redirects to: /                                     │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  7. All API calls include: Authorization: Bearer <JWT>  │
│     Backend validates token with Supabase               │
└─────────────────────────────────────────────────────────┘
```

## 🧪 Testing Locally

### 1. Update environment variables:

**Frontend (.env.local):**
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://ykkjvvntrhujzdzthxfb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_0rdUjYIQwTPtnWkMxOTZ4g_iXMWC_id
```

**Backend (.env):**
```bash
SUPABASE_URL=https://ykkjvvntrhujzdzthxfb.supabase.co
SUPABASE_ANON_KEY=sb_publishable_0rdUjYIQwTPtnWkMxOTZ4g_iXMWC_id
SUPABASE_SERVICE_KEY=<your-service-key>
FRONTEND_URL=http://localhost:3000
```

### 2. Add localhost redirect in Google Cloud Console:

```
http://localhost:8910/auth/v1/callback
```

(Note: Supabase local dev uses port 8910 for auth)

### 3. Start both servers:

```bash
# Terminal 1 - Backend
cd backend
uvicorn app.main:app --reload --loop asyncio

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 4. Test:

1. Visit http://localhost:3000
2. Should redirect to /login (not authenticated)
3. Click "Sign in with Google"
4. Complete OAuth
5. Should redirect to dashboard

## 🔍 Troubleshooting

### "Invalid credentials" error

**Cause:** JWT token validation failing

**Fix:**
- Check `SUPABASE_URL` and `SUPABASE_ANON_KEY` match in backend and frontend
- Verify Supabase project is correct
- Check browser console for detailed error

### Stuck on "Completing sign in..."

**Cause:** Auth callback not working

**Fix:**
- Check redirect URL is correct in Supabase
- Verify `/auth/callback` page exists in frontend
- Check browser console for errors

### "Authentication providers not configured"

**Cause:** Google OAuth not enabled in Supabase

**Fix:**
- Follow Step 2 above to enable Google provider
- Ensure Client ID and Secret are correct

### CORS errors

**Cause:** Frontend domain not allowed

**Fix:**
- Check CORS settings in [backend/app/main.py](backend/app/main.py)
- Ensure your Vercel domain is in `allow_origins`

## 📝 What Changed

### Files Modified:

**Backend:**
- [backend/app/services/supabase.py](backend/app/services/supabase.py) - Real JWT validation
- [backend/app/routers/auth.py](backend/app/routers/auth.py) - Added /me endpoint

**Frontend:**
- [frontend/src/lib/auth-context.tsx](frontend/src/lib/auth-context.tsx) - New auth context
- [frontend/src/lib/api.ts](frontend/src/lib/api.ts) - Send Bearer tokens
- [frontend/src/app/login/page.tsx](frontend/src/app/login/page.tsx) - Login page
- [frontend/src/app/auth/callback/page.tsx](frontend/src/app/auth/callback/page.tsx) - OAuth callback
- [frontend/src/app/page.tsx](frontend/src/app/page.tsx) - Protected dashboard
- [frontend/src/app/providers.tsx](frontend/src/app/providers.tsx) - Wrap with AuthProvider

### Security Improvements:

1. ✅ No more hardcoded demo user ID
2. ✅ All API requests require valid JWT
3. ✅ User-specific data isolation
4. ✅ Proper OAuth flow with Supabase
5. ✅ Session management with auto-refresh

## 🚀 Deploy Steps

Both frontend and backend will auto-deploy from GitHub:

1. **Railway** will redeploy backend with new auth code
2. **Vercel** will redeploy frontend with login page
3. Configure Google OAuth in Supabase (steps above)
4. Test at https://custompodcast.vercel.app/login

---

**Authentication is now production-ready!** 🎉

Once you complete the Supabase configuration (Steps 1-3), users can sign in with Google and have their own isolated data.
