// Generate a unique key for a reply to detect duplicates
export function getReplyKey(username: string, text: string): string {
  const textSnippet = text.slice(0, 100);
  return `@${username}:${textSnippet}`;
}

// Extract the main tweet author's username.
// Primary: parse from URL (/username/status/id).
// Fallback: extract from the first cell's DOM.
export function getMainTweetAuthor(firstCell?: Element | null): string | null {
  // Try URL first (most reliable on actual Twitter pages)
  const urlMatch = window.location.pathname.match(/^\/([^/]+)\/status\//);
  if (urlMatch) return urlMatch[1];

  // Fallback: extract from first cellInnerDiv
  if (firstCell) {
    const tweet = firstCell.querySelector('[data-testid="tweet"]');
    const userEl = tweet?.querySelector('[data-testid="User-Name"] a[href^="/"]');
    return userEl?.getAttribute("href")?.replace("/", "") || null;
  }

  return null;
}

// Get only NEW replies from DOM that aren't in the processed set
export function getNewRepliesFromDOM(
  processedKeys: Set<string>,
  maxReplies: number,
  currentCount: number
): Array<{ element: HTMLElement; username: string; text: string }> {
  const newReplies: Array<{ element: HTMLElement; username: string; text: string }> = [];
  const cells = document.querySelectorAll('[data-testid="cellInnerDiv"]');

  // Extract the main tweet author's username to exclude their replies.
  // Primary: parse from URL (/username/status/id) which is most reliable.
  // Fallback: extract from the first cellInnerDiv in the DOM.
  const mainAuthorUsername = getMainTweetAuthor(cells[0]);

  for (const cell of cells) {
    if (currentCount + newReplies.length >= maxReplies) break;

    const tweet = cell.querySelector('[data-testid="tweet"]');
    if (!tweet) continue;

    // Skip the main tweet (first one)
    if (cell === cells[0]) continue;

    const tweetText = tweet.querySelector('[data-testid="tweetText"]');
    const userNameEl = tweet.querySelector('[data-testid="User-Name"] a[href^="/"]');

    if (!tweetText || !userNameEl) continue;

    const username = userNameEl.getAttribute("href")?.replace("/", "") || "unknown";

    // Skip replies from the main tweet author
    if (mainAuthorUsername && username === mainAuthorUsername) continue;
    const text = tweetText.textContent || "";

    if (!text.trim()) continue;

    const key = getReplyKey(username, text);
    if (processedKeys.has(key)) continue;

    // Mark as processed immediately to avoid duplicates in same batch
    processedKeys.add(key);
    newReplies.push({
      element: tweet as HTMLElement,
      username,
      text,
    });
  }

  return newReplies;
}

// Scroll to trigger lazy loading of more replies
export async function scrollToLoadMore(): Promise<void> {
  const cells = document.querySelectorAll('[data-testid="cellInnerDiv"]');
  const lastCell = cells[cells.length - 1];

  if (lastCell) {
    lastCell.scrollIntoView({ behavior: "smooth", block: "end" });
  }

  // Wait for scroll animation and Twitter's lazy load
  await sleep(800);
}

// Wait for new content with MutationObserver (with timeout)
export function waitForNewContent(timeout: number = 2000): Promise<boolean> {
  return new Promise((resolve) => {
    let resolved = false;
    const initialCount = document.querySelectorAll('[data-testid="cellInnerDiv"]').length;

    const observer = new MutationObserver(() => {
      const currentCount = document.querySelectorAll('[data-testid="cellInnerDiv"]').length;
      if (currentCount > initialCount && !resolved) {
        resolved = true;
        observer.disconnect();
        resolve(true);
      }
    });

    // Observe the main content area for new nodes
    const timeline = document.querySelector('[data-testid="primaryColumn"]') || document.body;
    observer.observe(timeline, {
      childList: true,
      subtree: true,
    });

    // Timeout fallback
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        observer.disconnect();
        resolve(false);
      }
    }, timeout);
  });
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
