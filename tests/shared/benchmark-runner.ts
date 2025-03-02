import fs from "node:fs";
import path from "node:path";
import { test } from "bun:test";
import { waitForServer } from "./utils";

// Single image benchmark configuration
export const singleImageConfig = { width: 1000, height: 1000, format: "webp" };

// Define types for our benchmark results
export type BenchmarkConfig = {
  width: number;
  height: number;
  format: string;
};

export type BenchmarkResult = {
  config: BenchmarkConfig;
  duration: number;
};

type BenchmarkServerConfig = {
  type: "bun" | "node";
  port: number;
  startServer: () => Promise<any>;
  stopServer: (server: any) => Promise<void>;
  runBenchmark: (config: BenchmarkConfig) => Promise<BenchmarkResult>;
};

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

      const result = await runBenchmark(singleImageConfig);

      // Save the benchmark results
      const resultsPath = path.join(
        resultsDir,
        `${type}-single-image-benchmark.json`
      );

      const benchmarkResults = {
        timestamp: new Date().toISOString(),
        platform: type,
        version: type === "bun" ? Bun.version : process.version,
        result,
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
