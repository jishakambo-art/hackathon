# Testing Guide for DailyBrief Desktop App

## Quick Start

### 1. Install Dependencies

```bash
cd desktop
npm install
npx playwright install chromium
```

### 2. Run in Development Mode

```bash
npm start
```

This will launch the desktop app window.

## Testing the Full Flow

### Step 1: Sign In with Google

1. Click "Sign in with Google" button
2. Your default browser will open to https://custompodcast.vercel.app/login
3. Complete Google Sign In on the web app
4. After signing in, you need to get your access token:
   - Open browser DevTools (F12)
   - Go to Console
   - Run: `(await window.supabase.auth.getSession()).data.session.access_token`
   - Copy the token
5. Paste the token in the desktop app
6. Click "Verify Token"

### Step 2: Connect NotebookLM

1. Click "Connect NotebookLM" button
2. A Chromium browser window will open
3. Navigate to https://notebooklm.google.com/
4. Sign in with your Google account
5. Wait for the NotebookLM homepage to load
6. The window will close automatically
7. Credentials will be uploaded to the server

### Step 3: Complete

- You'll see a success message
- The app is ready to be closed
- Check the web app - your NotebookLM should now show as connected

## Troubleshooting

### Issue: "Playwright not found"

```bash
npx playwright install chromium
```

### Issue: Browser doesn't open

- Check that you have Chrome or Chromium installed
- Try running with DevTools open to see console logs

### Issue: Token verification fails

- Make sure you're signed in to the web app first
- The token expires after 1 hour - get a fresh one
- Check that the backend is running (Railway)

### Issue: Upload fails

- Check that you're connected to the internet
- Verify the API_URL in `src/renderer/app.js` is correct
- Check Railway logs for errors

## Building the Distributable

### Package for Mac

```bash
npm run make
```

This will create:
- `out/DailyBrief Setup-darwin-arm64/` - Unpackaged app
- `out/make/DailyBrief Setup.dmg` - Installable DMG
- `out/make/DailyBrief Setup-darwin-arm64.zip` - Zip archive

The DMG file can be distributed to users.

## File Locations

### Development

- App data: `~/Library/Application Support/dailybrief-setup/`
- Credentials: `~/Library/Application Support/dailybrief-setup/notebooklm_credentials/`

### Production

Same locations after building.

## Checking if It Worked

### On the Server (Railway)

Check if credentials were uploaded:

```bash
# SSH into Railway or check logs
ls -la .notebooklm_credentials/
# Should see: {user_id}.json and {user_id}_meta.json
```

### On the Web App

1. Go to https://custompodcast.vercel.app/sources/notebooklm
2. Should show "Connected to NotebookLM" if successful
3. Can now trigger podcast generation

## What's Next?

After successful setup:
1. User configures their sources (Substack, RSS, Topics) on web app
2. Server generates daily podcast at 7am PT automatically
3. User can manually trigger generation via web app

## Notes

- The desktop app only needs to be run ONCE per user
- After setup, users don't need the desktop app anymore
- The app stores credentials both locally and on the server
- Local credentials are used for backup/recovery
