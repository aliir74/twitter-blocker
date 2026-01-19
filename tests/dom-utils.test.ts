import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getReplyKey, getNewRepliesFromDOM, waitForNewContent } from "../lib/dom-utils";

describe("dom-utils", () => {
  describe("getReplyKey", () => {
    it("should create consistent keys for same username and text", () => {
      const key1 = getReplyKey("user1", "Hello world");
      const key2 = getReplyKey("user1", "Hello world");
      expect(key1).toBe(key2);
    });

    it("should create different keys for different usernames", () => {
      const key1 = getReplyKey("user1", "Hello world");
      const key2 = getReplyKey("user2", "Hello world");
      expect(key1).not.toBe(key2);
    });

    it("should create different keys for different text", () => {
      const key1 = getReplyKey("user1", "Hello world");
      const key2 = getReplyKey("user1", "Goodbye world");
      expect(key1).not.toBe(key2);
    });

    it("should truncate text to 100 characters", () => {
      const longText = "a".repeat(200);
      const key = getReplyKey("user1", longText);
      expect(key).toBe(`@user1:${"a".repeat(100)}`);
    });

    it("should include @ prefix for username", () => {
      const key = getReplyKey("testuser", "test text");
      expect(key.startsWith("@testuser:")).toBe(true);
    });
  });

  describe("getNewRepliesFromDOM", () => {
    beforeEach(() => {
      document.body.innerHTML = "";
    });

    afterEach(() => {
      document.body.innerHTML = "";
    });

    function createMockTweet(username: string, text: string): HTMLElement {
      const cell = document.createElement("div");
      cell.setAttribute("data-testid", "cellInnerDiv");

      const tweet = document.createElement("div");
      tweet.setAttribute("data-testid", "tweet");

      const tweetText = document.createElement("div");
      tweetText.setAttribute("data-testid", "tweetText");
      tweetText.textContent = text;

      const userName = document.createElement("div");
      userName.setAttribute("data-testid", "User-Name");
      const userLink = document.createElement("a");
      userLink.setAttribute("href", `/${username}`);
      userName.appendChild(userLink);

      tweet.appendChild(tweetText);
      tweet.appendChild(userName);
      cell.appendChild(tweet);

      return cell;
    }

    it("should return empty array when no tweets exist", () => {
      const processedKeys = new Set<string>();
      const replies = getNewRepliesFromDOM(processedKeys, 50, 0);
      expect(replies).toHaveLength(0);
    });

    it("should skip the first tweet (main tweet)", () => {
      const mainTweet = createMockTweet("mainuser", "Main tweet");
      const reply1 = createMockTweet("user1", "Reply 1");
      document.body.appendChild(mainTweet);
      document.body.appendChild(reply1);

      const processedKeys = new Set<string>();
      const replies = getNewRepliesFromDOM(processedKeys, 50, 0);

      expect(replies).toHaveLength(1);
      expect(replies[0].username).toBe("user1");
    });

    it("should extract username and text correctly", () => {
      const mainTweet = createMockTweet("mainuser", "Main tweet");
      const reply1 = createMockTweet("testuser", "Test reply text");
      document.body.appendChild(mainTweet);
      document.body.appendChild(reply1);

      const processedKeys = new Set<string>();
      const replies = getNewRepliesFromDOM(processedKeys, 50, 0);

      expect(replies[0].username).toBe("testuser");
      expect(replies[0].text).toBe("Test reply text");
    });

    it("should skip already processed replies", () => {
      const mainTweet = createMockTweet("mainuser", "Main tweet");
      const reply1 = createMockTweet("user1", "Reply 1");
      const reply2 = createMockTweet("user2", "Reply 2");
      document.body.appendChild(mainTweet);
      document.body.appendChild(reply1);
      document.body.appendChild(reply2);

      const processedKeys = new Set<string>();
      processedKeys.add("@user1:Reply 1");

      const replies = getNewRepliesFromDOM(processedKeys, 50, 0);

      expect(replies).toHaveLength(1);
      expect(replies[0].username).toBe("user2");
    });

    it("should respect maxReplies limit", () => {
      const mainTweet = createMockTweet("mainuser", "Main tweet");
      document.body.appendChild(mainTweet);

      for (let i = 0; i < 10; i++) {
        const reply = createMockTweet(`user${i}`, `Reply ${i}`);
        document.body.appendChild(reply);
      }

      const processedKeys = new Set<string>();
      const replies = getNewRepliesFromDOM(processedKeys, 5, 0);

      expect(replies).toHaveLength(5);
    });

    it("should respect currentCount when checking maxReplies", () => {
      const mainTweet = createMockTweet("mainuser", "Main tweet");
      document.body.appendChild(mainTweet);

      for (let i = 0; i < 10; i++) {
        const reply = createMockTweet(`user${i}`, `Reply ${i}`);
        document.body.appendChild(reply);
      }

      const processedKeys = new Set<string>();
      // Already have 3 replies, max is 5, so should only get 2 more
      const replies = getNewRepliesFromDOM(processedKeys, 5, 3);

      expect(replies).toHaveLength(2);
    });

    it("should add processed keys to the set", () => {
      const mainTweet = createMockTweet("mainuser", "Main tweet");
      const reply1 = createMockTweet("user1", "Reply 1");
      document.body.appendChild(mainTweet);
      document.body.appendChild(reply1);

      const processedKeys = new Set<string>();
      getNewRepliesFromDOM(processedKeys, 50, 0);

      expect(processedKeys.has("@user1:Reply 1")).toBe(true);
    });

    it("should skip tweets with empty text", () => {
      const mainTweet = createMockTweet("mainuser", "Main tweet");
      const emptyReply = createMockTweet("user1", "   ");
      const validReply = createMockTweet("user2", "Valid reply");
      document.body.appendChild(mainTweet);
      document.body.appendChild(emptyReply);
      document.body.appendChild(validReply);

      const processedKeys = new Set<string>();
      const replies = getNewRepliesFromDOM(processedKeys, 50, 0);

      expect(replies).toHaveLength(1);
      expect(replies[0].username).toBe("user2");
    });
  });

  describe("waitForNewContent", () => {
    beforeEach(() => {
      document.body.innerHTML = "";
      vi.useFakeTimers();
    });

    afterEach(() => {
      document.body.innerHTML = "";
      vi.useRealTimers();
    });

    it("should resolve false on timeout when no new content", async () => {
      const promise = waitForNewContent(1000);

      // Fast-forward time
      vi.advanceTimersByTime(1000);

      const result = await promise;
      expect(result).toBe(false);
    });

    it("should resolve true when new cellInnerDiv is added", async () => {
      // Start with one cell
      const initialCell = document.createElement("div");
      initialCell.setAttribute("data-testid", "cellInnerDiv");
      document.body.appendChild(initialCell);

      const promise = waitForNewContent(2000);

      // Advance a bit then add new content
      vi.advanceTimersByTime(100);

      const newCell = document.createElement("div");
      newCell.setAttribute("data-testid", "cellInnerDiv");
      document.body.appendChild(newCell);

      // MutationObserver callbacks are microtasks, need to flush
      await vi.runAllTimersAsync();

      const result = await promise;
      expect(result).toBe(true);
    });
  });
});
