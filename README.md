# PlayCanvas Project - GitHub Sync

This repository automatically syncs code to PlayCanvas using GitHub Actions.

## Setup Instructions

### 1. Repository Structure

**IMPORTANT:** The folder structure in this repository must match the structure in your PlayCanvas project.

For example, if you want to sync scripts:
```
/Scripts
  /Player
    player.js
  /UI
    menu.js
```

This structure should be identical in both GitHub and PlayCanvas.

### 2. Getting PlayCanvas Credentials

To enable automatic synchronization, you need to obtain three values from PlayCanvas:

#### **API Key** (`PC_API_KEY`)
1. Go to [PlayCanvas Account Settings](https://playcanvas.com/account)
2. Navigate to the **API Tokens** section
3. Click **"New Token"** or **"Generate Token"**
4. Copy the generated API key (you won't be able to see it again!)

#### **Project ID** (`PC_PROJECT_ID`) and **Branch ID** (`PC_BRANCH_ID`)

**Quick way** (recommended):
1. Open your project in PlayCanvas Editor
2. Open browser console (F12)
3. Run this command:
```javascript
copy({
  PC_PROJECT_ID: config.project.id,
  PC_BRANCH_ID: config.self.branch.id
})
```
4. The IDs are now copied to clipboard as JSON

**Manual way:**
- **Project ID**: Look at the URL `https://playcanvas.com/editor/scene/{PROJECT_ID}` - the number after `/scene/`
- **Branch ID**: Open **Version Control** panel, click on your branch, and find the Branch ID in the details

### 3. Adding Secrets to GitHub

Once you have the credentials:

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Add the following three secrets:

| Secret Name | Description |
|-------------|-------------|
| `PC_API_KEY` | Your PlayCanvas API Token |
| `PC_PROJECT_ID` | Your PlayCanvas Project ID |
| `PC_BRANCH_ID` | Your PlayCanvas Branch ID |

### 4. How It Works

The GitHub Action ([.github/workflows/syncPlaycanvas.yml](.github/workflows/syncPlaycanvas.yml)) automatically:

- Triggers on every push to the `main` branch
- Installs [playcanvas-sync](https://www.npmjs.com/package/playcanvas-sync) tool
- Syncs **only the `Scripts/` folder** to PlayCanvas
- Ignores system files (dotfiles, node_modules, etc.)
- Automatically confirms overwrites with the `--yes` flag

### 5. Configuration

You can modify sync behavior in [syncPlaycanvas.yml](.github/workflows/syncPlaycanvas.yml):

- **`PLAYCANVAS_INCLUDE_REG`**: Pattern for files to sync (default: only `Scripts/` folder)
- **`PLAYCANVAS_BAD_FILE_REG`**: Files to ignore (dotfiles, temp files, etc.)
- **`PLAYCANVAS_BAD_FOLDER_REG`**: Folders to ignore (dotfiles, node_modules)

### 6. Testing the Sync

After setting up:

1. Make a change to a file in the `Scripts/` folder
2. Commit and push to the `main` branch
3. Go to **Actions** tab in GitHub to see the workflow running
4. Check your PlayCanvas project to verify the changes

## Important Notes

- ⚠️ **Structure Must Match**: Your repository structure must exactly match the PlayCanvas project structure
- 🔒 **Scripts Only**: By default, only the `Scripts/` folder is synced to prevent accidental deletion of scenes or assets
- 🚀 **Auto-confirm**: The action uses `--yes` flag to automatically confirm overwrites
- 📝 **Check Logs**: Review the action logs to see what files were changed

## Troubleshooting

- If sync fails, check the Actions logs for error messages
- Verify all three secrets are correctly set in GitHub
- Ensure your API key has write permissions
- Confirm the Branch ID matches the branch you want to sync to
