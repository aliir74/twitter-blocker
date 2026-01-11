# Privacy Policy for Twitter Hate Blocker

Last updated: January 2025

## Overview

Twitter Hate Blocker is a browser extension that uses AI to detect hate speech in Twitter/X replies and optionally block offending users.

## Data Collection

This extension does **NOT** collect, store, or transmit any personal data to our servers. We do not have servers.

## Data Processing

The following data is processed locally or with third parties:

### Locally Stored Data

- **OpenRouter API Key**: Stored in your browser's local storage (chrome.storage.sync)
- **Extension Settings**: Model preferences, confidence threshold, and scan limits

### Data Sent to Third Parties

- **OpenRouter (openrouter.ai)**: Tweet reply text is sent to OpenRouter's API for hate speech analysis. This is required for the AI detection feature. OpenRouter's privacy policy applies to this data: https://openrouter.ai/privacy

## Permissions Explained

| Permission | Purpose |
|------------|---------|
| `storage` | To save your settings and API key locally |
| `activeTab` | To interact with the current Twitter/X tab |
| `host_permissions` (twitter.com, x.com) | To read tweet replies and perform blocking actions |
| `host_permissions` (openrouter.ai) | To send analysis requests to the AI service |

## Data Retention

- Local settings persist until you uninstall the extension or clear browser data
- No data is retained by the extension developer
- Data sent to OpenRouter is subject to their retention policies

## Your Rights

- You can delete all stored data by uninstalling the extension
- You can view your stored settings in the extension popup
- You can clear your API key at any time through the settings

## Security

- Your API key is stored using Chrome's secure storage API
- All communication with OpenRouter uses HTTPS
- No data is logged or transmitted to any other party

## Children's Privacy

This extension is not directed at children under 13. We do not knowingly collect information from children.

## Contact

For privacy questions, contact: [YOUR EMAIL HERE]

## Changes to This Policy

We may update this privacy policy from time to time. Changes will be posted here with an updated date. Continued use of the extension after changes constitutes acceptance of the new policy.

---

## Hosting This Privacy Policy

You need to host this privacy policy at a publicly accessible URL. Options:

1. **GitHub Pages**: Create a `gh-pages` branch or use `/docs` folder
2. **Your website**: Upload as an HTML page
3. **GitHub Gist**: Create a public gist (less professional but works)

### Converting to HTML

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Privacy Policy - Twitter Hate Blocker</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            line-height: 1.6;
            color: #333;
        }
        h1, h2, h3 { color: #1a1a1a; }
        table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
        th, td { border: 1px solid #ddd; padding: 0.75rem; text-align: left; }
        th { background: #f5f5f5; }
        code { background: #f0f0f0; padding: 0.2rem 0.4rem; border-radius: 3px; }
    </style>
</head>
<body>
    <!-- Convert the markdown above to HTML and paste here -->
</body>
</html>
```
