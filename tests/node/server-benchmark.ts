import { createServer } from "node:http";
import { getImgResponse } from "openimg/node";
import { convertToMB } from "../shared/utils";
import fs from "node:fs";
import path from "node:path";

// Create a server that measures memory usage when processing image requests
const server = createServer(async (req, res) => {
  try {
    const url = new URL(
      req.url || "",
      `http://${req.headers.host || "localhost"}`
    );

    // Only benchmark requests to the root path with image processing parameters
    if (url.pathname === "/") {
      // Create a proper Request object from the IncomingMessage
      const request = new Request(url.toString(), {
        method: req.method,
        headers: req.headers as HeadersInit,
      });

      // Measure memory before processing
      const memoryBefore = process.memoryUsage();
      const memoryBeforeMB = convertToMB(memoryBefore);

      // Process the image request
      const startTime = performance.now();
      const response = await getImgResponse(request, {
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
      console.log(`[Memory Benchmark] Request: ${url.toString()}`);
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
        `node-server-memory-usage.json`
      );

      const memoryReport = {
        timestamp: new Date().toISOString(),
        platform: "node",
        version: process.version,
        url: url.toString(),
        memoryBeforeMB,
        memoryAfterMB,
        memoryDiffMB,
        serverDuration,
      };

      fs.writeFileSync(memoryReportPath, JSON.stringify(memoryReport, null, 2));
      console.log(`[Memory Benchmark] Report saved to ${memoryReportPath}`);

      // Copy status
      res.statusCode = response.status;

      // Copy headers
      response.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });

      // Copy body
      const buffer = await response.arrayBuffer();
      res.end(Buffer.from(buffer));
    } else {
      // For non-root paths, just process the request normally
      const request = new Request(url.toString(), {
        method: req.method,
        headers: req.headers as HeadersInit,
      });

      const response = await getImgResponse(request, {
        headers: {
          "x-openimg-test": "true",
        },
      });

      // Copy status
      res.statusCode = response.status;

      // Copy headers
      response.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });

      // Copy body
      const buffer = await response.arrayBuffer();
      res.end(Buffer.from(buffer));
    }
  } catch (error) {
    console.error("Error processing request:", error);
    res.statusCode = 500;
    res.end("Internal Server Error");
  }
});

const port = process.env.PORT ? parseInt(process.env.PORT) : 3005;
server.listen(port, () => {
  console.log(`Memory benchmark server listening on port ${port}`);
});
