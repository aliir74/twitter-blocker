---
name: load-extension
description: Build the Chrome extension and guide loading it into Dia Browser (Personal profile) for local testing. Triggers on "load extension", "test extension", "build and load", or explicit /load-extension command.
---

# Load Extension into Dia Browser

## Step 1: Choose Mode

Ask the user which mode they want:

- **Dev mode** (`pnpm dev`) — Hot reload enabled. Changes auto-reload in the browser without re-loading unpacked.
- **Build mode** (`pnpm build`) — One-time production build. Must manually reload after code changes.

If the user already specified a mode, skip asking.

## Step 2: Run Build

Run the chosen command from the project root:

```bash
# Dev mode (hot reload)
pnpm dev

# OR Build mode (one-time)
pnpm build
```

**Note:** The WXT config has `runner.disabled: true` so `pnpm dev` will NOT auto-open a Chrome window. This is intentional — the user loads the extension manually into Dia Browser.

Wait for the build to complete successfully. If it fails, debug and fix before proceeding.

## Step 3: Show Output Path

Print the absolute path to the built extension:

```
Extension output: /Users/aliirani/conductor/workspaces/twitter-blocker-v1/surabaya/.output/chrome-mv3/
```

## Step 4: Loading Instructions for Dia Browser

### First Time Loading

1. Open Dia Browser with the **Personal** profile
2. Navigate to `dia://extensions`
3. Enable **Developer mode** (toggle in top-right corner)
4. Click **Load unpacked**
5. In the file picker, navigate to and select: `.output/chrome-mv3/`
6. The extension should appear in the extensions list

**Note:** The file picker dialog is manual and cannot be automated.

### Already Loaded (Reload)

If the extension is already loaded from a previous session:

1. Navigate to `dia://extensions`
2. Find the extension in the list
3. Click the **reload icon** (circular arrow) to pick up latest changes

### Dev Mode Notes

When using `pnpm dev`:
- Changes auto-reload — no need to re-load unpacked or click reload
- The dev server watches for file changes and rebuilds automatically
- Just keep the terminal running

### Build Mode Notes

When using `pnpm build`:
- After code changes, re-run `pnpm build`
- Then click the reload icon in `dia://extensions`
