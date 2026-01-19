// Generate a unique key for a reply to detect duplicates
export function getReplyKey(username: string, text: string): string {
  const textSnippet = text.slice(0, 100);
  return `@${username}:${textSnippet}`;
}

// Get only NEW replies from DOM that aren't in the processed set
export function getNewRepliesFromDOM(
  processedKeys: Set<string>,
  maxReplies: number,
  currentCount: number
): Array<{ element: HTMLElement; username: string; text: string }> {
  const newReplies: Array<{ element: HTMLElement; username: string; text: string }> = [];
  const cells = document.querySelectorAll('[data-testid="cellInnerDiv"]');

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
