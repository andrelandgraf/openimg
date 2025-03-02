import { getImgResponse } from "openimg/bun";
import { convertToMB } from "../shared/utils";
import fs from "node:fs";
import path from "node:path";

// Create a server that measures memory usage when processing image requests
Bun.serve({
  port: process.env.PORT ? parseInt(process.env.PORT) : 3005,
  async fetch(req) {
    const url = new URL(req.url);

    // Only benchmark requests to the root path with image processing parameters
    if (url.pathname === "/") {
      // Measure memory before processing
      const memoryBefore = process.memoryUsage();
      const memoryBeforeMB = convertToMB(memoryBefore);

      // Process the image request
      const startTime = performance.now();
      const response = await getImgResponse(req, {
        headers: {
          "x-openimg-test": "true",
        },
      });
      const endTime = performance.now();
      const serverDuration = endTime - startTime;

      // Measure memory after processing
      const memoryAfter = process.memoryUsage();
      const memoryAfterMB = convertToMB(memoryAfter);

      // Calculate memory difference
      const memoryDiffMB = {
        rss: memoryAfterMB.rss - memoryBeforeMB.rss,
        heapUsed: memoryAfterMB.heapUsed - memoryBeforeMB.heapUsed,
        heapTotal: memoryAfterMB.heapTotal - memoryBeforeMB.heapTotal,
        external: memoryAfterMB.external - memoryBeforeMB.external,
        arrayBuffers: memoryAfterMB.arrayBuffers - memoryBeforeMB.arrayBuffers,
      };

      // Log memory usage
      console.log(`[Memory Benchmark] Request: ${req.url}`);
      console.log(
        `[Memory Benchmark] Processing time: ${serverDuration.toFixed(2)}ms`
      );
      console.log(
        `[Memory Benchmark] Memory before (MB): RSS: ${memoryBeforeMB.rss.toFixed(
          2
        )}, Heap Used: ${memoryBeforeMB.heapUsed.toFixed(2)}`
      );
      console.log(
        `[Memory Benchmark] Memory after (MB): RSS: ${memoryAfterMB.rss.toFixed(
          2
        )}, Heap Used: ${memoryAfterMB.heapUsed.toFixed(2)}`
      );
      console.log(
        `[Memory Benchmark] Memory diff (MB): RSS: ${memoryDiffMB.rss.toFixed(
          2
        )}, Heap Used: ${memoryDiffMB.heapUsed.toFixed(2)}`
      );

      // Save memory report
      const resultsDir = path.join(process.cwd(), "benchmark-results");
      if (!fs.existsSync(resultsDir)) {
        fs.mkdirSync(resultsDir, { recursive: true });
      }

      const memoryReportPath = path.join(
        resultsDir,
        `bun-server-memory-usage.json`
      );

      const memoryReport = {
        timestamp: new Date().toISOString(),
        platform: "bun",
        version: Bun.version,
        url: req.url,
        memoryBeforeMB,
        memoryAfterMB,
        memoryDiffMB,
        serverDuration,
      };

      fs.writeFileSync(memoryReportPath, JSON.stringify(memoryReport, null, 2));
      console.log(`[Memory Benchmark] Report saved to ${memoryReportPath}`);

      return response;
    }

    // For non-root paths, just process the request normally
    return getImgResponse(req, {
      headers: {
        "x-openimg-test": "true",
      },
    });
  },
});
