import ReactDOM from "react-dom/client";
import { FloatingButton } from "./FloatingButton";
import { LiveFeedPanel } from "./LiveFeedPanel";
import type { Settings } from "@/lib/storage";
import type { AnalysisResult } from "@/lib/openrouter";
import "./style.css";

export interface ReplyData {
  element: HTMLElement;
  username: string;
  text: string;
  status: "pending" | "analyzing" | "safe" | "hate" | "blocked" | "error";
  result?: AnalysisResult;
}

export default defineContentScript({
  matches: ["*://twitter.com/*", "*://x.com/*"],
  cssInjectionMode: "ui",

  async main(ctx) {
    console.log("Twitter Hate Blocker content script loaded");

    let panelRoot: ReactDOM.Root | null = null;
    let buttonRoot: ReactDOM.Root | null = null;
    let isScanning = false;
    let replies: ReplyData[] = [];

    // Create UI containers
    const buttonContainer = document.createElement("div");
    buttonContainer.id = "thb-button-container";
    document.body.appendChild(buttonContainer);

    const panelContainer = document.createElement("div");
    panelContainer.id = "thb-panel-container";
    document.body.appendChild(panelContainer);

    // Mount React components
    buttonRoot = ReactDOM.createRoot(buttonContainer);
    panelRoot = ReactDOM.createRoot(panelContainer);

    function renderButton() {
      buttonRoot?.render(
        <FloatingButton
          onClick={startScan}
          isScanning={isScanning}
        />
      );
    }

    function renderPanel() {
      panelRoot?.render(
        <LiveFeedPanel
          replies={replies}
          isScanning={isScanning}
          onClose={stopScan}
        />
      );
    }

    async function startScan() {
      if (isScanning) return;

      const settings = await browser.runtime.sendMessage({ type: "GET_SETTINGS" }) as Settings;

      if (!settings.apiKey) {
        alert("Please configure your OpenRouter API key in the extension settings.");
        return;
      }

      isScanning = true;
      replies = [];
      renderButton();
      renderPanel();

      // Get replies from DOM
      const replyElements = getRepliesFromDOM(settings.maxReplies);
      replies = replyElements.map((el) => ({
        element: el.element,
        username: el.username,
        text: el.text,
        status: "pending" as const,
      }));
      renderPanel();

      // Analyze each reply
      for (let i = 0; i < replies.length; i++) {
        if (!isScanning) break;

        replies[i].status = "analyzing";
        renderPanel();

        const result = await browser.runtime.sendMessage({
          type: "ANALYZE_REPLY",
          text: replies[i].text,
        }) as AnalysisResult;

        replies[i].result = result;

        if (result.error) {
          replies[i].status = "error";
        } else if (result.isHate && result.confidence >= settings.confidenceThreshold) {
          replies[i].status = "hate";
          renderPanel();

          // Attempt to block
          const blocked = await blockUser(replies[i].element);
          replies[i].status = blocked ? "blocked" : "hate";
        } else {
          replies[i].status = "safe";
        }

        renderPanel();

        // Small delay between requests
        await sleep(300);
      }

      isScanning = false;
      renderButton();
      renderPanel();
    }

    function stopScan() {
      isScanning = false;
      replies = [];
      renderButton();
      renderPanel();
    }

    // Initial render
    renderButton();
    renderPanel();
  },
});

function getRepliesFromDOM(maxReplies: number): Array<{ element: HTMLElement; username: string; text: string }> {
  const replies: Array<{ element: HTMLElement; username: string; text: string }> = [];
  const cells = document.querySelectorAll('[data-testid="cellInnerDiv"]');

  for (const cell of cells) {
    if (replies.length >= maxReplies) break;

    const tweet = cell.querySelector('[data-testid="tweet"]');
    if (!tweet) continue;

    // Skip the main tweet (first one)
    if (cell === cells[0]) continue;

    const tweetText = tweet.querySelector('[data-testid="tweetText"]');
    const userNameEl = tweet.querySelector('[data-testid="User-Name"] a[href^="/"]');

    if (!tweetText || !userNameEl) continue;

    const username = userNameEl.getAttribute("href")?.replace("/", "") || "unknown";
    const text = tweetText.textContent || "";

    if (text.trim()) {
      replies.push({
        element: tweet as HTMLElement,
        username,
        text,
      });
    }
  }

  return replies;
}

async function blockUser(replyElement: HTMLElement): Promise<boolean> {
  try {
    // Find and click the "More" button (3-dot menu)
    const moreButton = replyElement.querySelector('[data-testid="caret"]') as HTMLElement;
    if (!moreButton) {
      console.log("More button not found");
      return false;
    }

    moreButton.click();
    await sleep(500);

    // Find the block option in dropdown
    const menuItems = document.querySelectorAll('[role="menuitem"]');
    let blockItem: HTMLElement | null = null;

    for (const item of menuItems) {
      if (item.textContent?.toLowerCase().includes("block")) {
        blockItem = item as HTMLElement;
        break;
      }
    }

    if (!blockItem) {
      console.log("Block option not found in menu");
      // Close menu by clicking elsewhere
      document.body.click();
      return false;
    }

    blockItem.click();
    await sleep(500);

    // Click confirm button
    const confirmButton = document.querySelector('[data-testid="confirmationSheetConfirm"]') as HTMLElement;
    if (!confirmButton) {
      console.log("Confirm button not found");
      return false;
    }

    confirmButton.click();
    await sleep(300);

    return true;
  } catch (error) {
    console.error("Error blocking user:", error);
    return false;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
