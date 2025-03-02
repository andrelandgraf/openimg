import { runNoCacheTests } from "../../shared/test-runner-no-cache.js";
import fs from "node:fs";
import http from "node:http";
import { getImgResponse } from "openimg/node";

// Configure the Node.js-specific server setup for no-cache tests
runNoCacheTests({
  type: "node",
  port: 3001,
  startServer: async () => {
    // Create a server directly instead of importing
    const server = http.createServer(async (req, res) => {
      const headers = {
        "x-openimg-test": "true",
      };

      // getImgResponse expects a Request object, but we have an IncomingMessage
      // We need to create a proper Request object from the IncomingMessage
      const url = new URL(
        req.url || "",
        `http://${req.headers.host || "localhost"}`
      );
      const request = new Request(url.toString(), {
        method: req.method,
        headers: req.headers as HeadersInit,
      });

      // Use a non-existent cache folder to effectively disable caching
      const response = await getImgResponse(request, {
        headers,
        cacheFolder: "no_cache",
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
    });

    // Start listening
    await new Promise<void>((resolve) => {
      server.listen(3001, () => {
        console.log("No-cache server started on port 3001");
        resolve();
      });
    });

    return server;
  },
  stopServer: async (server: http.Server) => {
    if (server) {
      // Close the server
      await new Promise<void>((resolve) => {
        server.close(() => {
          console.log("Server process terminated");
          resolve();
        });
      });
    }
  },
  fileExists: (path: string) => {
    return fs.existsSync(path);
  },
});
