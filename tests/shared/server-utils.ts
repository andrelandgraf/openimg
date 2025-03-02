/**
 * Shared utilities for server testing
 */

/**
 * Waits for a server to be ready by attempting to connect to it
 * @param url The URL to connect to
 * @param timeoutMs Timeout in milliseconds
 * @param retryIntervalMs Retry interval in milliseconds
 */
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
