# Privacy Policy — Twitter Hate Blocker

**Last updated:** April 4, 2026

## What This Extension Does

Twitter Hate Blocker scans reply threads on Twitter/X for hateful or abusive content using AI classification. It can block, report, or both block and report flagged accounts.

## Data Collection

### What We Collect

- **Tweet reply text**: Sent to our backend server for AI-based hate speech classification. This data is processed in real time and is not stored after classification.
- **Client ID**: A randomly generated UUID stored locally on your device and sent with requests for rate limiting purposes only.

### What We Do NOT Collect

- No personally identifiable information (name, email, etc.)
- No authentication credentials
- No browsing history
- No financial information
- No location data
- No health information

## Data Storage

- **User preferences** (blocking mode, action mode, language, scan limit) are stored locally on your device using browser.storage.sync.
- **Daily usage counters** are stored locally to enforce rate limits.
- **The backend server** stores only a hashed client ID and daily request counts for rate limiting. No tweet content is stored.

## Third-Party Services

Tweet text is sent to our Cloudflare Worker backend, which forwards it to OpenRouter API for AI classification. No user-identifiable information is included in these requests.

## Data Sharing

We do not sell, transfer, or share any user data with third parties outside of the AI classification described above.

## Changes

We may update this policy from time to time. Changes will be reflected in the "Last updated" date above.

## Contact

For questions about this privacy policy, open an issue at https://github.com/aliir74/twitter-blocker/issues.
