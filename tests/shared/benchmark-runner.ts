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

// Single image benchmark configuration
export const singleImageConfig = { width: 300, height: 300, format: "webp" };

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

      // Sort results by configuration parameters to ensure consistent ordering across runs
      results.sort((a, b) => {
        // First sort by format
        if (a.config.format !== b.config.format) {
          return a.config.format.localeCompare(b.config.format);
        }
        // Then by width
        if (a.config.width !== b.config.width) {
          return a.config.width - b.config.width;
        }
        // Finally by height
        return a.config.height - b.config.height;
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

      // Add a small delay to ensure proper cleanup before the next test
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }, 60000); // 60 second timeout for the benchmark test
}

/**
 * Run a benchmark for a single image transformation to monitor performance in isolation
 */
export function runSingleImageBenchmark(config: BenchmarkServerConfig) {
  const { type, port, startServer, stopServer, runBenchmark } = config;
  const baseUrl = `http://localhost:${port}`;

  test("benchmark single image transform operation", async () => {
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

      // Run the single image benchmark multiple times to get an average
      const iterations = 5;
      const singleResults = [];

      for (let i = 0; i < iterations; i++) {
        // Run the benchmark and collect the result
        const result = await runBenchmark(singleImageConfig);
        singleResults.push(result);

        // Small delay between runs
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Record overall memory usage
      const finalMemory = process.memoryUsage();
      const finalMemoryMB = convertToMB(finalMemory);

      // Calculate average durations and memory usage
      const avgResult = {
        config: singleImageConfig,
        serverDuration:
          singleResults.reduce((sum, r) => sum + (r.serverDuration || 0), 0) /
          iterations,
        clientDuration:
          singleResults.reduce((sum, r) => sum + (r.clientDuration || 0), 0) /
          iterations,
        memoryDiffMB: {
          rss:
            singleResults.reduce((sum, r) => sum + r.memoryDiffMB.rss, 0) /
            iterations,
          heapUsed:
            singleResults.reduce((sum, r) => sum + r.memoryDiffMB.heapUsed, 0) /
            iterations,
          heapTotal:
            singleResults.reduce(
              (sum, r) => sum + r.memoryDiffMB.heapTotal,
              0
            ) / iterations,
          external:
            singleResults.reduce((sum, r) => sum + r.memoryDiffMB.external, 0) /
            iterations,
          arrayBuffers:
            singleResults.reduce(
              (sum, r) => sum + r.memoryDiffMB.arrayBuffers,
              0
            ) / iterations,
        },
      };

      // Save the benchmark results
      const timestamp = new Date().toISOString();
      const resultsPath = path.join(
        resultsDir,
        `${type}-single-image-benchmark.json`
      );

      const benchmarkResults = {
        timestamp,
        platform: type,
        version: type === "bun" ? Bun.version : process.version,
        iterations,
        finalMemoryMB: finalMemoryMB,
        result: avgResult,
        allResults: singleResults,
      };

      fs.writeFileSync(resultsPath, JSON.stringify(benchmarkResults, null, 2));
      console.log(`Single image benchmark results saved to ${resultsPath}`);
    } finally {
      // Shut down the server
      await stopServer(server);

      // Add a small delay to ensure proper cleanup before the next test
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }, 30000); // 30 second timeout for the single image benchmark test
}
