# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Twitter Hate Blocker is a Chrome extension that scans replies on Twitter/X, detects problematic content using a Cloudflare Worker backend for AI classification, and automatically blocks, reports, or both blocks and reports offending users by simulating UI clicks. The backend proxies OpenRouter API calls with a server-side key so end users need zero configuration.

### Blocking Modes

The extension supports three mutually exclusive blocking modes (user selects one):

1. **Hate Speech** (default) - Detects direct hatred, slurs, harassment, and offensive language targeting the tweet's author specifically. Does not flag political opinions, disagreements, or hate directed at third parties/groups.

2. **Cult Praise** - Detects abnormally sycophantic, cult-like devotion including worship-like adoration, blind obedience language, and extreme tribalism. Does not flag normal positive engagement or fan enthusiasm.

3. **Block All** - Blocks every account found on the page without any AI analysis. Useful for hashtag pages where user wants to block all participants. Shows a confirmation dialog before starting. Has its own client-side cap of 500/day.

## Commands

```bash
# Extension development (hot reload)
pnpm dev              # Chrome
pnpm dev:firefox      # Firefox

# Extension build
pnpm build            # Chrome
pnpm build:firefox    # Firefox

# Package for distribution
pnpm zip
pnpm zip:firefox

# Extension testing
pnpm test             # Run extension tests
pnpm test:watch       # Watch mode
pnpm test:coverage    # With coverage

# Run a single test file
pnpm vitest run tests/storage.test.ts

# Backend (from root — uses Makefile)
make dev-backend      # Run backend locally
make test-backend     # Run backend tests
make deploy           # Deploy backend to Cloudflare
make db-migrate-local # Apply D1 schema locally
make db-migrate       # Apply D1 schema to production
make secret           # Set OpenRouter API key as Cloudflare secret

# Cross-project
make test             # Run ALL tests (extension + backend)
make install          # Install all dependencies
make clean            # Remove build artifacts
```

## Architecture

**Framework:** WXT (WebExtension Framework) with React + TypeScript, Manifest V3

### Entry Points

- `entrypoints/background.ts` - Service worker handling message passing, client registration on install, and proxying analysis requests to the Cloudflare Worker backend
- `entrypoints/twitter.content/` - Content script injected into Twitter/X pages
  - `index.tsx` - Main scan orchestration, collection/analysis phases, block/report execution
  - `FloatingButton.tsx` - Scan trigger button
  - `LiveFeedPanel.tsx` - Results panel with stats, badges, and copy-stats button
  - `OnboardingOverlay.tsx` - First-run explanation overlay
- `entrypoints/popup/` - Settings UI (blocking mode, action mode, language, max replies)

### Libraries

- `lib/storage.ts` - Settings persistence via `browser.storage.sync`, daily usage tracking, onboarding state
- `lib/backend-client.ts` - Client for the Cloudflare Worker backend (register + analyze endpoints)
- `lib/i18n.ts` - Bilingual strings (English/Persian) with locale detection and RTL support
- `lib/dom-utils.ts` - DOM utilities for Twitter reply extraction and auto-scroll

### Backend (`backend/`)

Cloudflare Worker + D1 (SQLite) that proxies OpenRouter API calls:

- `backend/src/index.ts` - Worker entry point with `/register` and `/analyze` routes
- `backend/src/prompts.ts` - LLM prompts (hate speech + cult praise), model config, confidence threshold
- `backend/schema.sql` - D1 database schema (users + daily_usage tables)
- `backend/wrangler.toml` - Worker + D1 configuration

The backend holds the OpenRouter API key server-side so users don't need one. Model (Gemma 3 12B) and confidence threshold (90%) are hardcoded server-side.

### Theme System

All colors are defined as CSS custom properties in `assets/theme.css` using the `--thb-` prefix (to avoid collisions with Twitter's CSS). Both entry points import this file before their local styles.

Token categories: surfaces (`--thb-bg-*`), text (`--thb-text-*`), borders (`--thb-border`), accent (`--thb-accent-*`), and semantic colors for success/danger/warning/info/purple states.

When adding new UI, use existing tokens from `assets/theme.css` instead of hardcoding hex values. Add new tokens there if needed.

### Message Flow

```
Content Script → Background Worker → Cloudflare Worker → OpenRouter API
     ↓                    ↓                  ↓
  Twitter DOM         Proxies request    Rate limits, classifies
                      with clientId      Returns: {isMatch, confidence, reason}
```

The content script extracts reply text from Twitter DOM, sends it to the background worker, which calls the Cloudflare Worker backend for classification. The backend applies the confidence threshold (90%) server-side. Results flow back to update the UI and trigger the configured action (block, report, or both) if the reply is flagged.

### Settings

Key settings stored in `browser.storage.sync`:

- `clientId` (string) - Auto-generated UUID, registered with backend on first install
- `locale` ("en" | "fa", default: "en") - UI language, auto-detected from `navigator.language`
- `blockingMode` ("hate" | "cultPraise" | "blockAll", default: "hate") - Detection mode
- `actionMode` ("block" | "report" | "both", default: "block") - Action on flagged accounts
- `maxReplies` (25 | 50 | 100, default: 50) - Max replies to scan per session
- `autoScroll` (boolean, default: true) - Enable/disable auto-scroll to find more replies
- `dryRun` (boolean, default: false) - Analyze only without actually taking action

### Auto-Scroll Feature

The extension supports auto-scrolling to collect lazy-loaded replies:

1. **Collection Phase**: Scrolls the page to trigger Twitter's lazy loading, collecting new replies until `maxReplies` is reached or no new content appears after 3 scroll attempts.
2. **Analysis Phase**: Processes collected replies sequentially through the AI classifier (or immediately flags all in Block All mode).

### i18n (Internationalization)

`lib/i18n.ts` contains a simple object with `en` and `fa` keys (~50 strings each). No framework needed.

- Locale auto-detected from `navigator.language` on first install
- User can toggle between English and Persian in the settings popup
- When Persian is active, injected containers get `dir="rtl"` and `data-lang="fa"`
- RTL layout handled via `[data-lang="fa"]` CSS selectors in style files
- LLM prompts stay in English (Gemma 3 12B handles Persian content well)

### Twitter DOM Selectors

| Element | Selector |
|---------|----------|
| Reply container | `[data-testid="cellInnerDiv"]` |
| Tweet text | `[data-testid="tweetText"]` |
| Username | `[data-testid="User-Name"] a[href^="/"]` |
| More button | `[data-testid="caret"]` |
| Block confirm | `[data-testid="confirmationSheetConfirm"]` |
| Report flow done | `[data-testid="reportFlowDoneButton"]` |
| Report flow next | `[data-testid="reportFlowNextButton"]` |
| Choice next | `[data-testid="choiceSelectionNextButton"]` |

## Testing

Tests use Vitest with jsdom environment. The `tests/setup.ts` provides a mock `browser` global that simulates WebExtension APIs.

Path alias `@/` resolves to project root (configured in `vitest.config.ts`).

Backend tests run separately using `@cloudflare/vitest-pool-workers` with a miniflare D1 binding. The root vitest config excludes `backend/` to avoid import conflicts.

## Loading the Extension

1. Run `pnpm build`
2. Open `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked" and select `.output/chrome-mv3`
