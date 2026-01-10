# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Twitter Hate Blocker is a Chrome extension that scans replies on Twitter/X, detects hate speech using OpenRouter AI, and automatically blocks offending users by simulating UI clicks.

## Commands

```bash
# Development (hot reload)
pnpm dev              # Chrome
pnpm dev:firefox      # Firefox

# Build
pnpm build            # Chrome
pnpm build:firefox    # Firefox

# Package for distribution
pnpm zip
pnpm zip:firefox

# Testing
pnpm test             # Run all tests
pnpm test:watch       # Watch mode
pnpm test:coverage    # With coverage

# Run a single test file
pnpm vitest run tests/storage.test.ts
```

## Architecture

**Framework:** WXT (WebExtension Framework) with React + TypeScript, Manifest V3

### Entry Points

- `entrypoints/background.ts` - Service worker handling message passing and OpenRouter API calls
- `entrypoints/twitter.content/` - Content script injected into Twitter/X pages
- `entrypoints/popup/` - Settings UI (API key, model selection, thresholds)

### Libraries

- `lib/storage.ts` - Settings persistence via `browser.storage.sync`
- `lib/openrouter.ts` - OpenRouter API client for hate speech classification

### Message Flow

```
Content Script → Background Worker → OpenRouter API
     ↓                    ↓
  Twitter DOM         Returns: {isHate, confidence, reason}
```

The content script extracts reply text from Twitter DOM, sends it to the background worker, which calls OpenRouter for classification. Results flow back to update the UI and trigger blocking if confidence exceeds threshold.

### Twitter DOM Selectors

| Element | Selector |
|---------|----------|
| Reply container | `[data-testid="cellInnerDiv"]` |
| Tweet text | `[data-testid="tweetText"]` |
| Username | `[data-testid="User-Name"] a[href^="/"]` |
| More button | `[data-testid="caret"]` |
| Block confirm | `[data-testid="confirmationSheetConfirm"]` |

## Testing

Tests use Vitest with jsdom environment. The `tests/setup.ts` provides a mock `browser` global that simulates WebExtension APIs.

Path alias `@/` resolves to project root (configured in `vitest.config.ts`).

## Loading the Extension

1. Run `pnpm build`
2. Open `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked" and select `.output/chrome-mv3`
