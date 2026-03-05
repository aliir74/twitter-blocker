import ReactDOM from "react-dom/client";
import { FloatingButton } from "./FloatingButton";
import { LiveFeedPanel } from "./LiveFeedPanel";
import type { Settings, BlockingMode, ActionMode } from "@/lib/storage";
import type { AnalysisResult } from "@/lib/openrouter";
import { getNewRepliesFromDOM, getMainTweetText, scrollToLoadMore, waitForNewContent, sleep } from "@/lib/dom-utils";
import "../../assets/theme.css";
import "./style.css";

export interface ReplyData {
  element: HTMLElement;
  username: string;
  text: string;
  status: "pending" | "analyzing" | "safe" | "flagged" | "blocked" | "reported" | "actioned" | "error";
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
    let currentSettings: Settings | null = null;

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
          dryRun={currentSettings?.dryRun}
          blockingMode={currentSettings?.blockingMode}
          actionMode={currentSettings?.actionMode}
        />
      );
    }

    function renderPanel() {
      panelRoot?.render(
        <LiveFeedPanel
          replies={replies}
          isScanning={isScanning}
          onClose={stopScan}
          blockingMode={currentSettings?.blockingMode ?? "hate"}
          actionMode={currentSettings?.actionMode ?? "block"}
        />
      );
    }

    async function startScan() {
      if (isScanning) return;

      try {
        currentSettings = await browser.runtime.sendMessage({ type: "GET_SETTINGS" }) as Settings;
      } catch (error) {
        alert("Extension error. Please refresh the page and try again.");
        return;
      }
      const settings = currentSettings;

      // Block All mode confirmation
      if (settings.blockingMode === "blockAll") {
        const actionText = settings.actionMode === "report" ? "REPORT" : settings.actionMode === "both" ? "BLOCK AND REPORT" : "BLOCK";
        const dryRunText = settings.dryRun ? ` (Dry Run - no actual ${actionText.toLowerCase()}s)` : "";
        const confirmed = confirm(
          `WARNING: Block All mode is enabled${dryRunText}.\n\n` +
          `This will ${settings.dryRun ? "identify" : actionText} EVERY account found on this page ` +
          `(up to ${settings.maxReplies} accounts).\n\n` +
          `Are you sure you want to continue?`
        );
        if (!confirmed) return;
      } else {
        // Only require API key for LLM-based modes
        if (!settings.apiKey) {
          alert("Please configure your OpenRouter API key in the extension settings.");
          return;
        }
      }

      isScanning = true;
      replies = [];
      const processedKeys = new Set<string>();
      let scrollAttemptsWithoutNew = 0;
      const mainTweetText = getMainTweetText();

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

      // Phase 2: Process collected replies
      for (let i = 0; i < replies.length; i++) {
        if (!isScanning) break;

        // Block All mode: skip LLM analysis entirely
        if (settings.blockingMode === "blockAll") {
          replies[i].status = "flagged";
          replies[i].result = {
            isMatch: true,
            confidence: 100,
            reason: "Block All mode",
          };
          renderPanel();

          // Attempt action (unless dry-run mode)
          if (!settings.dryRun) {
            replies[i].status = await executeAction(replies[i].element, settings.actionMode);
          }
          renderPanel();

          // Small delay between actions
          await sleep(300);
          continue;
        }

        // LLM-based analysis for hate/cultPraise modes
        replies[i].status = "analyzing";
        renderPanel();

        try {
          const result = await browser.runtime.sendMessage({
            type: "ANALYZE_REPLY",
            text: replies[i].text,
            mainTweetText,
          }) as AnalysisResult;

          replies[i].result = result;

          if (result.error) {
            replies[i].status = "error";
          } else if (result.isMatch && result.confidence >= settings.confidenceThreshold) {
            replies[i].status = "flagged";
            renderPanel();

            // Attempt action (unless dry-run mode)
            if (!settings.dryRun) {
              replies[i].status = await executeAction(replies[i].element, settings.actionMode);
            }
          } else {
            replies[i].status = "safe";
          }
        } catch (error) {
          replies[i].status = "error";
          replies[i].result = {
            isMatch: false,
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

    // Load initial settings and render
    async function init() {
      try {
        currentSettings = await browser.runtime.sendMessage({ type: "GET_SETTINGS" }) as Settings;
      } catch {
        // Settings will be loaded when scan starts
      }
      renderButton();
      renderPanel();
    }

    init();
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

async function dismissAllDialogs(): Promise<void> {
  // Try clicking known dismiss buttons
  const dismissSelectors = [
    "[data-testid=\"reportFlowDoneButton\"]",
    "[data-testid=\"app-bar-close\"]",
    "[aria-label=\"Close\"]",
  ];
  for (const sel of dismissSelectors) {
    const btn = document.querySelector(sel) as HTMLElement;
    if (btn) {
      btn.click();
      await sleep(300);
      return;
    }
  }

  // Fallback: click body to dismiss any remaining overlays/menus
  document.body.click();
  await sleep(300);

  // Wait for dialogs to be removed from DOM
  const maxWait = 5;
  for (let i = 0; i < maxWait; i++) {
    const dialog = document.querySelector("[role=\"dialog\"]");
    if (!dialog) return;
    await sleep(200);
  }
}

async function reportUser(replyElement: HTMLElement): Promise<boolean> {
  try {
    // Find and click the "More" button (3-dot menu)
    const moreButton = replyElement.querySelector('[data-testid="caret"]') as HTMLElement;
    if (!moreButton) {
      console.log("More button not found");
      return false;
    }

    moreButton.click();
    await sleep(500);

    // Find the report option in dropdown
    const menuItems = document.querySelectorAll('[role="menuitem"]');
    let reportItem: HTMLElement | null = null;

    for (const item of menuItems) {
      if (item.textContent?.toLowerCase().includes("report")) {
        reportItem = item as HTMLElement;
        break;
      }
    }

    if (!reportItem) {
      console.log("Report option not found in menu");
      document.body.click();
      return false;
    }

    reportItem.click();
    await sleep(800);

    // Find and click the hateful content reason using cascading selectors
    const reasonSelectors = ["[role=\"radio\"]", "[role=\"option\"]", "[role=\"dialog\"] span"];
    const reasonKeywords = ["hate", "hateful", "abusive", "harassment"];
    let reasonClicked = false;

    for (const selector of reasonSelectors) {
      if (reasonClicked) break;
      const elements = document.querySelectorAll(selector);
      for (const el of elements) {
        const text = el.textContent?.toLowerCase() ?? "";
        if (reasonKeywords.some((keyword) => text.includes(keyword))) {
          (el as HTMLElement).click();
          reasonClicked = true;
          break;
        }
      }
    }

    if (!reasonClicked) {
      console.log("Report reason not found, clicking first available option");
      const firstOption = document.querySelector('[role="radio"], [role="option"]') as HTMLElement;
      if (firstOption) {
        firstOption.click();
      }
    }

    await sleep(500);

    // Click Next/Submit button
    const submitSelectors = [
      '[data-testid="choiceSelectionNextButton"]',
      '[data-testid="reportFlowNextButton"]',
      '[data-testid="confirmationSheetConfirm"]',
    ];

    let submitted = false;
    for (const sel of submitSelectors) {
      const btn = document.querySelector(sel) as HTMLElement;
      if (btn) {
        btn.click();
        submitted = true;
        break;
      }
    }

    // Fallback: find button by text
    if (!submitted) {
      const buttons = document.querySelectorAll("button, [role='button']");
      for (const btn of buttons) {
        const text = btn.textContent?.toLowerCase() ?? "";
        if (text.includes("next") || text.includes("submit")) {
          (btn as HTMLElement).click();
          submitted = true;
          break;
        }
      }
    }

    if (!submitted) {
      console.log("Submit button not found in report wizard");
      await dismissAllDialogs();
      return false;
    }

    await sleep(800);

    // After submitting the report, Twitter shows a "Submitted" screen
    // with Mute/Block/Done options. Wait for and click "Done" to dismiss.
    // Retry several times since the screen may take a moment to appear.
    const doneSelectors = [
      '[data-testid="reportFlowDoneButton"]',
      '[data-testid="choiceSelectionNextButton"]',
      '[data-testid="reportFlowNextButton"]',
    ];

    let dismissed = false;
    for (let attempt = 0; attempt < 10; attempt++) {
      for (const sel of doneSelectors) {
        const btn = document.querySelector(sel) as HTMLElement;
        if (btn) {
          btn.click();
          dismissed = true;
          break;
        }
      }
      if (dismissed) break;

      // Fallback: look for "Done" button by text
      const buttons = document.querySelectorAll("button, [role='button']");
      for (const btn of buttons) {
        const text = btn.textContent?.trim().toLowerCase() ?? "";
        if (text === "done") {
          (btn as HTMLElement).click();
          dismissed = true;
          break;
        }
      }
      if (dismissed) break;

      await sleep(500);
    }

    await sleep(300);

    // Dismiss any remaining dialogs
    if (!dismissed) {
      await dismissAllDialogs();
    }

    return true;
  } catch (error) {
    console.error("Error reporting user:", error);
    await dismissAllDialogs();
    return false;
  }
}

async function executeAction(
  replyElement: HTMLElement,
  actionMode: ActionMode
): Promise<ReplyData["status"]> {
  if (actionMode === "report") {
    const reported = await reportUser(replyElement);
    return reported ? "reported" : "flagged";
  }

  if (actionMode === "both") {
    // Report first since blocking may prevent further interaction
    const reported = await reportUser(replyElement);
    await dismissAllDialogs();
    await sleep(500);
    const blocked = await blockUser(replyElement);
    if (reported && blocked) return "actioned";
    if (blocked) return "blocked";
    if (reported) return "reported";
    return "flagged";
  }

  // Default: block only
  const blocked = await blockUser(replyElement);
  return blocked ? "blocked" : "flagged";
}
