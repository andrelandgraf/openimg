import { type Subprocess } from "bun";
import { runSingleImageBenchmark } from "../../shared/benchmark-runner";
import type {
  BenchmarkConfig,
  BenchmarkResult,
} from "../../shared/benchmark-runner";
import { waitForServer, convertToMB } from "../../shared/utils";

// Run the single image benchmark for Bun
runSingleImageBenchmark({
  type: "bun",
  port: 3000,
  startServer: async () => {
    console.log("Starting single image benchmark server on port 3000");

    // Start the server as a subprocess
    const serverProcess = Bun.spawn(["bun", "run", "server.ts"], {
      stdout: "inherit",
      stderr: "inherit",
    });

    // Wait for the server to be ready
    await waitForServer("http://localhost:3000");

    return serverProcess;
  },
  stopServer: async (serverProcess: Subprocess) => {
    if (serverProcess) {
      serverProcess.kill();
      console.log("Single image benchmark server process terminated");
    }
  },
  runBenchmark: async (config: BenchmarkConfig): Promise<BenchmarkResult> => {
    const { width, height, format } = config;
    const url = `http://localhost:3000/?src=/cat.png&w=${width}&h=${height}&format=${format}`;

    console.log(`Requesting: ${url}`);

    // Measure memory before request
    const memoryBefore = process.memoryUsage();
    const memoryBeforeMB = convertToMB(memoryBefore);
    console.log(
      `Memory before (MB): RSS: ${memoryBeforeMB.rss.toFixed(
        2
      )}, Heap Used: ${memoryBeforeMB.heapUsed.toFixed(2)}`
    );

    // Make the request and measure duration
    const startTime = performance.now();
    const response = await fetch(url);
    await response.arrayBuffer();
    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(`Request completed in ${duration.toFixed(2)}ms`);

    // Measure memory after request
    const memoryAfter = process.memoryUsage();
    const memoryAfterMB = convertToMB(memoryAfter);
    console.log(
      `Memory after (MB): RSS: ${memoryAfterMB.rss.toFixed(
        2
      )}, Heap Used: ${memoryAfterMB.heapUsed.toFixed(2)}`
    );

    // Calculate memory difference
    const memoryDiffMB = {
      rss: memoryAfterMB.rss - memoryBeforeMB.rss,
      heapUsed: memoryAfterMB.heapUsed - memoryBeforeMB.heapUsed,
      heapTotal: memoryAfterMB.heapTotal - memoryBeforeMB.heapTotal,
      external: memoryAfterMB.external - memoryBeforeMB.external,
      arrayBuffers: memoryAfterMB.arrayBuffers - memoryBeforeMB.arrayBuffers,
    };

    console.log(
      `Memory diff (MB): RSS: ${memoryDiffMB.rss.toFixed(
        2
      )}, Heap Used: ${memoryDiffMB.heapUsed.toFixed(2)}`
    );

    return {
      config,
      clientDuration: duration,
      memoryDiffMB,
    };
  },
});
