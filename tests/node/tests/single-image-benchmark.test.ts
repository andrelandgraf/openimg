import { createServer } from "node:http";
import { runSingleImageBenchmark } from "../../shared/benchmark-runner";
import type {
  BenchmarkConfig,
  BenchmarkResult,
} from "../../shared/benchmark-runner";
import { waitForServer } from "../../shared/utils";
import { type Subprocess } from "bun";

// Run the client-side single image benchmark for Node.js
runSingleImageBenchmark({
  type: "node",
  port: 3005,
  startServer: async () => {
    console.log("Starting benchmark server on port 3005");

    // Start the server-benchmark.ts as a subprocess
    const serverProcess = Bun.spawn(["bunx", "tsx", "server-benchmark.ts"], {
      stdout: "inherit",
      stderr: "inherit",
    });

    // Wait for the server to be ready
    await waitForServer("http://localhost:3005");

    return serverProcess;
  },
  stopServer: async (serverProcess: Subprocess) => {
    if (serverProcess) {
      serverProcess.kill();
      console.log("Benchmark server process terminated");
    }
  },
  runBenchmark: async (config: BenchmarkConfig): Promise<BenchmarkResult> => {
    const { width, height, format } = config;
    const url = `http://localhost:3005/?src=/cat.png&w=${width}&h=${height}&format=${format}`;

    console.log(`Requesting: ${url}`);

    // Make the request and measure client-side duration only
    const startTime = performance.now();
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(`Client request completed in ${duration.toFixed(2)}ms`);

    // Return only client duration, server will track its own memory usage
    return {
      config,
      duration,
    };
  },
});
