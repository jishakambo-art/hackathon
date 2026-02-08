# Creating Your First GitHub Release

The desktop app has been built successfully! Follow these steps to create a GitHub release:

## Step 1: Go to GitHub Releases

1. Go to: https://github.com/jishakambo-art/hackathon/releases
2. Click "Create a new release"

## Step 2: Create a Tag

1. In the "Choose a tag" dropdown, type: `v1.0.0`
2. Click "Create new tag: v1.0.0 on publish"

## Step 3: Fill in Release Details

- **Release title**: `DailyBrief Desktop v1.0.0`
- **Description**:
```markdown
## DailyBrief Desktop App

Download and run the desktop app to connect your NotebookLM account.

### Installation

**Option 1: DMG (Recommended)**
1. Download the DMG file below
2. Open the DMG
3. Drag "DailyBrief Setup" to your Applications folder
4. Launch the app from Applications
5. If macOS says the app can't be opened, go to System Settings > Privacy & Security and click "Open Anyway"

**Option 2: ZIP**
1. Download the ZIP file below
2. Extract the ZIP file
3. Drag "DailyBrief Setup.app" to your Applications folder
4. Launch the app and follow the setup instructions
5. If macOS says the app can't be opened, go to System Settings > Privacy & Security and click "Open Anyway"

### Requirements
- macOS 10.13 or later
- Internet connection

### What's New
- Initial release
- NotebookLM authentication via browser
- Secure credential upload to server
```

## Step 4: Upload the Files

1. Click "Attach binaries by dropping them here or selecting them"

2. **Upload DMG** (Recommended):
   - Navigate to: `/Users/jishakambo/Documents/Hackathon/desktop/out/`
   - Upload: `DailyBrief-Setup.dmg`
   - Rename to: `DailyBrief-Setup-Mac.dmg`

3. **Upload ZIP** (Alternative):
   - Navigate to: `/Users/jishakambo/Documents/Hackathon/desktop/out/make/zip/darwin/x64/`
   - Upload: `DailyBrief Setup-darwin-x64-1.0.0.zip`
   - Rename to: `DailyBrief-Setup-Mac.zip`

## Step 5: Publish

1. Leave "Set as the latest release" checked
2. Click "Publish release"

## Done!

Users can now download the app from:
https://github.com/jishakambo-art/hackathon/releases/latest

The download button in your web app will automatically point to the latest release.
