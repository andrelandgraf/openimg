import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { getImgResponse } from "openimg/node";
import { convertToMB } from "../shared/utils";
import fs from "node:fs";
import path from "node:path";

const app = new Hono();

// Create a server that measures memory usage when processing image requests
app.get("*", async (c) => {
  const url = new URL(c.req.url);

  // Only benchmark requests to the root path with image processing parameters
  if (url.pathname === "/") {
    // Measure memory before processing
    const memoryBefore = process.memoryUsage();
    const memoryBeforeMB = convertToMB(memoryBefore);

    // Process the image request
    const startTime = performance.now();
    const headers = new Headers();
    headers.set("x-openimg-test", "true");
    const response = await getImgResponse(c.req.raw, { headers });
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
    console.log(`[Memory Benchmark] Request: ${c.req.url}`);
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
      url: c.req.url,
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
  const headers = new Headers();
  headers.set("x-openimg-test", "true");
  return getImgResponse(c.req.raw, { headers });
});

const port = process.env.PORT ? parseInt(process.env.PORT) : 3005;
console.log(`Memory benchmark server listening on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
