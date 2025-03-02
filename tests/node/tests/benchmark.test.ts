import { createServer } from "node:http";
import { getImgResponse } from "openimg/node";
import { runBenchmark, convertToMB } from "../../shared/benchmark-runner";
import type {
  BenchmarkConfig,
  BenchmarkResult,
} from "../../shared/benchmark-runner";

// Run the benchmark for Node.js
runBenchmark({
  type: "node",
  port: 3000,
  startServer: async () => {
    console.log("Starting benchmark server on port 3000");

    // Create a simple HTTP server
    const server = createServer(async (req, res) => {
      try {
        const headers = {
          "x-openimg-test": "true",
        };

        // Create a proper Request object from the IncomingMessage
        const url = new URL(
          req.url || "",
          `http://${req.headers.host || "localhost"}`
        );
        const request = new Request(url.toString(), {
          method: req.method,
          headers: req.headers as HeadersInit,
        });

        const response = await getImgResponse(request, { headers });

        // Copy status
        res.statusCode = response.status;

        // Copy headers
        response.headers.forEach((value, key) => {
          res.setHeader(key, value);
        });

        // Copy body
        const buffer = await response.arrayBuffer();
        res.end(Buffer.from(buffer));
      } catch (error) {
        console.error("Error processing request:", error);
        res.statusCode = 500;
        res.end("Internal Server Error");
      }
    });

    // Start the server
    return new Promise((resolve) => {
      server.listen(3000, () => {
        resolve(server);
      });
    });
  },
  stopServer: async (server) => {
    return new Promise((resolve) => {
      server.close(() => {
        console.log("Benchmark server stopped");
        resolve();
      });
    });
  },
  runBenchmark: async (config: BenchmarkConfig): Promise<BenchmarkResult> => {
    const { width, height, format } = config;
    const url = `http://localhost:3000/?src=https://picsum.photos/seed/openimg/1000/1000&w=${width}&h=${height}&format=${format}`;

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
    const buffer = await response.arrayBuffer();
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
