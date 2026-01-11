# Chrome Web Store Submission Guide

This document contains all the content needed to submit Twitter Hate Blocker to the Chrome Web Store.

## Prerequisites

1. **Google Developer Account** - Register at [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/) (one-time $5 fee)

2. **Build the extension package**
   ```bash
   pnpm build
   pnpm zip
   ```
   This creates a `.zip` file in `.output/chrome-mv3.zip`

---

## Basic Information

**Extension Name:**
```
Twitter Hate Blocker
```

**Short Description (132 chars max):**
```
AI-powered hate speech detection for Twitter/X. Scan replies, identify harmful content, and automatically block toxic accounts.
```

**Category:**
```
Social & Communication
```

---

## Detailed Description

```
Twitter Hate Blocker uses AI to scan Twitter/X replies and automatically block users posting hate speech, making your social media experience safer and more pleasant.

🔍 HOW IT WORKS
1. Navigate to any tweet on Twitter/X
2. Click the floating "Scan Replies" button
3. Watch as AI analyzes each reply in real-time
4. Hateful content is automatically detected and users are blocked

⚙️ FEATURES
• AI-Powered Detection: Uses advanced language models via OpenRouter to accurately identify hate speech, harassment, and toxic content
• Real-Time Analysis: Live feed panel shows scanning progress with detailed results
• Adjustable Sensitivity: Set your own confidence threshold (50-100%) for when to block
• Multiple AI Models: Choose from various OpenRouter models to balance speed and accuracy
• Configurable Limits: Control how many replies to scan per session (up to 200)
• Transparent Results: See exactly why content was flagged with explanations

🔒 PRIVACY & DATA
• Your API key is stored locally in your browser
• Reply text is sent to OpenRouter for analysis only
• No data is collected or stored by this extension
• Works entirely client-side on Twitter/X

📋 REQUIREMENTS
• An OpenRouter API key (get one at openrouter.ai)
• Works on twitter.com and x.com

💡 TIPS
• Start with a 75% confidence threshold and adjust based on results
• Use faster models for quick scans, more powerful models for accuracy
• The extension only blocks when the confidence exceeds your threshold

Take back control of your Twitter experience. Block hate speech automatically and enjoy healthier conversations.
```

---

## Required Assets

| Asset | Specification | Status |
|-------|---------------|--------|
| Icon | 128x128 PNG | ⬜ TODO |
| Screenshot 1 | Floating scan button on tweet (1280x800 or 640x400) | ⬜ TODO |
| Screenshot 2 | Live feed panel with results (1280x800 or 640x400) | ⬜ TODO |
| Screenshot 3 | Settings popup (1280x800 or 640x400) | ⬜ TODO |
| Screenshot 4 | Blocked user example (1280x800 or 640x400) | ⬜ TODO |
| Promotional tile | 440x280 PNG (optional) | ⬜ TODO |

### Screenshot Suggestions

1. **Screenshot 1**: Show a tweet with replies and the floating "Scan Replies" button visible in the corner
2. **Screenshot 2**: Show the live feed panel during a scan with mixed results (safe, hate, blocked statuses)
3. **Screenshot 3**: Show the extension popup with settings filled in
4. **Screenshot 4**: Show a reply marked as "Blocked" with the reason displayed

---

## Justification for Permissions

Use this text when asked to justify your extension's permissions during review:

```
This extension requires the following permissions:

1. storage - Required to persist user settings (API key, model selection, thresholds) across browser sessions.

2. activeTab - Required to inject the scanning UI and interact with Twitter/X pages when the user initiates a scan.

3. Host permissions for twitter.com and x.com - Required to read tweet replies from the DOM and simulate clicks to block users identified as posting hate speech.

4. Host permission for openrouter.ai - Required to send tweet text to OpenRouter's AI API for hate speech classification.

All permissions are used solely for the extension's core functionality of detecting and blocking hate speech on Twitter/X.
```

---

## Publishing Steps

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
2. Click **"New Item"**
3. Upload your `.zip` file from `.output/chrome-mv3.zip`
4. Fill in the store listing with content from this document
5. Upload screenshots and icons
6. Add privacy policy URL (see `privacy-policy.md`)
7. Set distribution options:
   - Visibility: Public (or Unlisted for testing)
   - Regions: All regions (or select specific ones)
8. Submit for review

---

## Review Process

- Initial review typically takes **1-3 business days**
- Google reviews for policy compliance, security, and functionality
- You'll get an email when approved or if changes are needed

## Common Rejection Reasons

- Missing or inadequate privacy policy
- Unclear permission justifications
- Screenshots that don't match actual functionality
- Description that doesn't match what the extension does
