/**
 * Shared benchmark runner for both openimg/bun and openimg/node
 */
import fs from "node:fs";
import path from "node:path";
import { expect, test } from "bun:test";

// Define the benchmark configurations
export const benchmarkConfigs = [
  { width: 100, height: 100, format: "webp" },
  { width: 200, height: 200, format: "webp" },
  { width: 300, height: 300, format: "webp" },
  { width: 400, height: 400, format: "webp" },
  { width: 500, height: 500, format: "webp" },
  { width: 100, height: 100, format: "avif" },
  { width: 200, height: 200, format: "avif" },
  { width: 300, height: 300, format: "avif" },
  { width: 400, height: 400, format: "avif" },
  { width: 500, height: 500, format: "avif" },
  { width: 100, height: 100, format: "png" },
  { width: 200, height: 200, format: "png" },
  { width: 300, height: 300, format: "png" },
  { width: 400, height: 400, format: "png" },
  { width: 500, height: 500, format: "png" },
  { width: 100, height: 100, format: "jpeg" },
  { width: 200, height: 200, format: "jpeg" },
  { width: 300, height: 300, format: "jpeg" },
  { width: 400, height: 400, format: "jpeg" },
  { width: 500, height: 500, format: "jpeg" },
];

// Define types for our benchmark results
export type BenchmarkConfig = {
  width: number;
  height: number;
  format: string;
};

export type MemoryUsageMB = {
  rss: number;
  heapTotal: number;
  heapUsed: number;
  external: number;
  arrayBuffers: number;
};

export type BenchmarkResult = {
  config: BenchmarkConfig;
  serverDuration?: number;
  clientDuration?: number;
  memoryDiffMB: {
    rss: number;
    heapUsed: number;
    heapTotal: number;
    external: number;
    arrayBuffers: number;
  };
};

// Helper function to convert bytes to MB
export function convertToMB(memory: NodeJS.MemoryUsage): MemoryUsageMB {
  const MB = 1024 * 1024;
  return {
    rss: memory.rss / MB,
    heapTotal: memory.heapTotal / MB,
    heapUsed: memory.heapUsed / MB,
    external: memory.external / MB,
    arrayBuffers: memory.arrayBuffers / MB,
  };
}

// Helper function to wait for the server to be ready
export async function waitForServer(url: string): Promise<void> {
  let retries = 10;
  while (retries > 0) {
    try {
      const res = await fetch(url);
      if (res.status === 400) {
        // Server is up but returning 400 for the empty request, which is expected
        return;
      }
    } catch (e) {
      // Ignore errors and retry
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
    retries--;
  }
  throw new Error(`Server at ${url} did not respond in time`);
}

type BenchmarkServerConfig = {
  type: "bun" | "node";
  port: number;
  startServer: () => Promise<any>;
  stopServer: (server: any) => Promise<void>;
  runBenchmark: (config: BenchmarkConfig) => Promise<BenchmarkResult>;
};

export function runBenchmark(config: BenchmarkServerConfig) {
  const { type, port, startServer, stopServer, runBenchmark } = config;
  const baseUrl = `http://localhost:${port}`;

  test("benchmark resize/transform operations", async () => {
    // Create a directory for the benchmark results if it doesn't exist
    const resultsDir = path.join(process.cwd(), "benchmark-results");
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    // Start the benchmark server
    const server = await startServer();

    try {
      // Wait for the server to be ready
      await waitForServer(baseUrl);

      // Reset cache folder
      try {
        fs.rmdirSync("./data", { recursive: true });
      } catch {}

      // Run all requests in parallel
      const requests = benchmarkConfigs.map(async (config) => {
        return await runBenchmark(config);
      });

      // Wait for all requests to complete
      const results = await Promise.all(requests);

      // Record overall memory usage
      const finalMemory = process.memoryUsage();
      const finalMemoryMB = convertToMB(finalMemory);

      // Sort results by server duration or client duration
      results.sort((a, b) => {
        if (a.serverDuration && b.serverDuration) {
          return a.serverDuration - b.serverDuration;
        } else if (a.clientDuration && b.clientDuration) {
          return a.clientDuration - b.clientDuration;
        }
        return 0;
      });

      // Save the benchmark results
      const timestamp = new Date().toISOString();
      const resultsPath = path.join(resultsDir, `${type}-benchmark.json`);

      const benchmarkResults = {
        timestamp,
        platform: type,
        version: type === "bun" ? Bun.version : process.version,
        finalMemoryMB: finalMemoryMB,
        results,
      };

      fs.writeFileSync(resultsPath, JSON.stringify(benchmarkResults, null, 2));
      console.log(`Benchmark results saved to ${resultsPath}`);
    } finally {
      // Shut down the server
      await stopServer(server);
    }
  }, 60000); // 60 second timeout for the benchmark test
}
