# Twitter Hate Blocker

[![GitHub Sponsors](https://img.shields.io/badge/sponsor-30363D?style=for-the-badge&logo=GitHub-Sponsors&logoColor=#EA4AAA)](https://github.com/sponsors/aliir74)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://www.buymeacoffee.com/aliir74)

A Chrome extension that scans replies on Twitter/X, detects hateful content using AI, and automatically blocks or reports offending accounts. Zero configuration required.

## Features

- **AI-powered detection** with server-side classification (no API keys needed)
- **Three detection modes:**
  - **Hate Speech** — Flags direct hatred, slurs, and harassment targeting you
  - **Cult Praise** — Flags abnormally sycophantic, cult-like devotion
  - **Block All** — Blocks every account on the page (useful for hashtag cleanup)
- **Three action modes:** Block, Report, or Both
- **Auto-scroll** to find more replies beyond the initial page load
- **Live results panel** showing flagged accounts with confidence scores and reasons
- **Dry run mode** to preview what would be blocked without taking action
- **Bilingual UI** — English and Persian (فارسی)
- **Configurable scan limit** (25, 50, or 100 replies)
- **Daily usage tracking** to stay within platform limits

## Installation

### Chrome Web Store

Coming soon.

### Manual Installation

1. Clone this repo
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Build the extension:
   ```bash
   pnpm build
   ```
4. Open `chrome://extensions` and enable "Developer mode"
5. Click "Load unpacked" and select the `.output/chrome-mv3` folder

## How It Works

1. Navigate to a tweet with replies on Twitter/X
2. Click the scan button that appears on the page
3. The extension collects replies and sends the text to a Cloudflare Worker backend
4. The backend classifies each reply using AI (Gemma 3 12B via OpenRouter)
5. Flagged accounts are automatically blocked, reported, or both based on your settings

```
Content Script → Background Worker → Cloudflare Worker → OpenRouter API
     ↓                    ↓                  ↓
  Twitter DOM         Proxies request    Rate limits, classifies
                      with clientId      Returns: {isMatch, confidence, reason}
```

## Development

```bash
# Dev with hot reload
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build

# Package as zip
pnpm zip
```

## Tech Stack

- **Extension:** WXT + React + TypeScript (Manifest V3)
- **Backend:** Cloudflare Worker + D1 (SQLite)
- **AI Model:** Gemma 3 12B via OpenRouter
- **Testing:** Vitest

## Privacy

Tweet text is sent to a secure backend for AI classification only. No data is stored beyond rate limiting. No login or account required. See the full [Privacy Policy](PRIVACY.md).

## Support This Project

If you find this project useful, consider supporting its development:

- Star this repo
- Report bugs and submit PRs
- [Sponsor on GitHub](https://github.com/sponsors/aliir74) or [Buy me a coffee](https://www.buymeacoffee.com/aliir74)

## License

MIT
