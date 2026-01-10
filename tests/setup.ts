import { vi } from "vitest";
import "@testing-library/jest-dom/vitest";

// Mock browser API (WebExtension polyfill)
const mockStorage: Record<string, unknown> = {};

const browserMock = {
  storage: {
    sync: {
      get: vi.fn(async (key: string) => {
        return { [key]: mockStorage[key] };
      }),
      set: vi.fn(async (items: Record<string, unknown>) => {
        Object.assign(mockStorage, items);
      }),
    },
  },
  runtime: {
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
    },
  },
};

// @ts-expect-error - mocking global browser object
globalThis.browser = browserMock;

// Reset mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
  Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
});

export { browserMock, mockStorage };
