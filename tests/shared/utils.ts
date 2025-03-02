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
    expectedContentType: "image/png",
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

export function cleanupCache(fs: any) {
  try {
    fs.rmdirSync("./data", { recursive: true });
  } catch {}
}

export function convertToMB(memory: NodeJS.MemoryUsage) {
  const MB = 1024 * 1024;
  return {
    rss: memory.rss / MB,
    heapTotal: memory.heapTotal / MB,
    heapUsed: memory.heapUsed / MB,
    external: memory.external / MB,
    arrayBuffers: memory.arrayBuffers / MB,
  };
}

export async function waitForServer(
  url: string,
  timeoutMs: number = 3000,
  retryIntervalMs: number = 300
): Promise<void> {
  let waiting = true;
  const timeout = setTimeout(() => {
    console.error(`Could not start or reach server at ${url}`);
    process.exit(1);
  }, timeoutMs);

  while (waiting) {
    try {
      await fetch(url);
      clearTimeout(timeout);
      waiting = false;
    } catch (err: unknown) {
      console.log("Waiting for server response...", err);
      await new Promise((res) => setTimeout(res, retryIntervalMs));
    }
  }
}
