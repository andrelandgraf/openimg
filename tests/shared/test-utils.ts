/**
 * Shared test utilities for both Bun and Node.js tests
 */

// Common test cases that can be reused across both Bun and Node.js tests
export const testCases = {
  notFoundImage: {
    url: "?src=/cat2.png&w=100&h=100&format=avif",
    expectedStatus: 404,
  },
  forbiddenRemoteOrigin: {
    url: "?src=https://example.com/cat2.png&w=100&h=100&format=avif",
    expectedStatus: 403,
  },
  webpFormat: {
    url: "?src=/cat.png&w=100&h=100&format=webp",
    expectedStatus: 200,
    expectedContentType: "image/webp",
    expectedCachePath: "./data/images/public/cat-png-w-100-h-100-fit-base.webp",
  },
  avifFormat: {
    url: "?src=/cat.png&w=100&h=100&format=avif",
    expectedStatus: 200,
    expectedContentType: "image/avif",
    expectedCachePath: "./data/images/public/cat-png-w-100-h-100-fit-base.avif",
  },
  originalFormat: {
    url: "?src=/cat.png&w=100&h=100",
    expectedStatus: 200,
    expectedContentType: "image/jpeg",
    expectedCachePath: "./data/images/public/cat-png-w-100-h-100-fit-base.png",
  },
  customHeaders: {
    url: "?src=/cat.png&w=100&h=100&format=webp",
    expectedStatus: 200,
    expectedHeaders: {
      "x-openimg-test": "true",
    },
  },
};

// Helper function to clean up cache directory
export function cleanupCache(fs: any) {
  try {
    fs.rmdirSync("./data", { recursive: true });
  } catch {}
}
