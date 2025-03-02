import { afterEach, expect } from "bun:test";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

// Add custom matcher for toInclude
const customMatchers = {
  toInclude: (received: unknown, expected: string) => {
    if (received === null || typeof received !== "string") {
      return {
        pass: false,
        message: () => `Expected ${received} to include "${expected}"`,
      };
    }
    const pass = received.includes(expected);
    return {
      pass,
      message: () =>
        pass
          ? `Expected "${received}" not to include "${expected}"`
          : `Expected "${received}" to include "${expected}"`,
    };
  },
};

// Extend with both jest-dom matchers and custom matchers
expect.extend({
  ...matchers,
  ...customMatchers,
});

// Optional: cleans up `render` after each test
afterEach(() => {
  cleanup();
});
