import ReactDOM from "react-dom/client";
import { FloatingButton } from "./FloatingButton";
import { LiveFeedPanel } from "./LiveFeedPanel";
import type { Settings } from "@/lib/storage";
import type { AnalysisResult } from "@/lib/openrouter";
import { getNewRepliesFromDOM, scrollToLoadMore, waitForNewContent, sleep } from "@/lib/dom-utils";
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
  cssInjectionMode: "manifest",

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

      let settings: Settings;
      try {
        settings = await browser.runtime.sendMessage({ type: "GET_SETTINGS" }) as Settings;
      } catch (error) {
        alert("Extension error. Please refresh the page and try again.");
        return;
      }

      if (!settings.apiKey) {
        alert("Please configure your OpenRouter API key in the extension settings.");
        return;
      }

      isScanning = true;
      replies = [];
      const processedKeys = new Set<string>();
      let scrollAttemptsWithoutNew = 0;

      renderButton();
      renderPanel();

      // Phase 1: Collect replies with auto-scroll
      while (isScanning && replies.length < settings.maxReplies) {
        // Get new replies from current DOM state
        const newReplies = getNewRepliesFromDOM(
          processedKeys,
          settings.maxReplies,
          replies.length
        );

        if (newReplies.length > 0) {
          // Add new replies to our list
          for (const el of newReplies) {
            replies.push({
              element: el.element,
              username: el.username,
              text: el.text,
              status: "pending" as const,
            });
          }
          renderPanel();
          scrollAttemptsWithoutNew = 0;
        }

        // Check if we've reached max replies
        if (replies.length >= settings.maxReplies) {
          console.log(`Reached max replies limit (${settings.maxReplies})`);
          break;
        }

        // Check if auto-scroll is enabled
        if (!settings.autoScroll) {
          console.log("Auto-scroll disabled, scanning only visible replies");
          break;
        }

        // Try to scroll for more content
        await scrollToLoadMore();
        const foundNew = await waitForNewContent(2000);

        if (!foundNew) {
          scrollAttemptsWithoutNew++;
          console.log(`No new content after scroll (attempt ${scrollAttemptsWithoutNew}/${settings.maxScrollAttemptsWithoutNewContent})`);

          if (scrollAttemptsWithoutNew >= settings.maxScrollAttemptsWithoutNewContent) {
            console.log("Max scroll attempts reached without new content");
            break;
          }
        }
      }

      // Phase 2: Analyze collected replies sequentially
      for (let i = 0; i < replies.length; i++) {
        if (!isScanning) break;

        replies[i].status = "analyzing";
        renderPanel();

        try {
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
        } catch (error) {
          replies[i].status = "error";
          replies[i].result = {
            isHate: false,
            confidence: 0,
            reason: "Connection error",
            error: error instanceof Error ? error.message : "Extension disconnected",
          };
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
