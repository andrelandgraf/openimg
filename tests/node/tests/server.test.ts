import { runTests } from "../../shared/test-runner.js";
import fs from "node:fs";
import http from "node:http";
import { getImgResponse } from "openimg/node";

// Configure the Node.js-specific server setup
runTests({
  type: "node",
  port: 3000,
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
    });

    // Start listening
    await new Promise<void>((resolve) => {
      server.listen(3000, () => {
        console.log("Server started on port 3000");
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
