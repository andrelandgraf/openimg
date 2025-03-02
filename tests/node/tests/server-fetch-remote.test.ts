import { runFetchRemoteTests } from "../../shared/test-runner-fetch-remote.js";
import fs from "node:fs";
import http from "node:http";
import { getImgResponse } from "openimg/node";

const remote = "http://localhost:3003";

async function computeKey(): Promise<string> {
  return Promise.resolve("123");
}

// Configure the Node.js-specific server setup for fetch-remote tests
runFetchRemoteTests({
  type: "node",
  port: 3002,
  remotePort: 3003,
  startServer: async () => {
    // Create a server directly
    const server = http.createServer(async (req, res) => {
      console.log("GET", req.url);

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

      const response = await getImgResponse(request, {
        allowlistedOrigins: [remote],
        getImgSource: async ({ request }) => {
          const src = new URL(request.url).searchParams.get("src");
          if (!src) {
            return new Response("src is required", { status: 400 });
          }
          const headers = new Headers();
          const key = await computeKey();
          headers.set("api-key", key);
          const url = remote + "/" + "?" + "src=" + src;
          console.log("fetching", url.toString());
          return {
            type: "fetch",
            url,
            headers,
          };
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
    });

    // Start listening
    await new Promise<void>((resolve) => {
      server.listen(3002, () => {
        console.log("'server' server running on port 3002!");
        resolve();
      });
    });

    return server;
  },
  startRemoteServer: async () => {
    // Create a remote server directly
    const remoteServer = http.createServer(async (req, res) => {
      console.log("GET", req.url);

      const key = req.headers["api-key"];
      if (!key || key !== "123") {
        console.error("Unauthorized");
        res.statusCode = 401;
        res.end("Unauthorized");
        return;
      }

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

      const response = await getImgResponse(request);

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
      remoteServer.listen(3003, () => {
        console.log("'remote' server running on port 3003");
        resolve();
      });
    });

    return remoteServer;
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
  stopRemoteServer: async (remoteServer: http.Server) => {
    if (remoteServer) {
      // Close the remote server
      await new Promise<void>((resolve) => {
        remoteServer.close(() => {
          console.log("Remote server process terminated");
          resolve();
        });
      });
    }
  },
  fileExists: (path: string) => {
    return fs.existsSync(path);
  },
});
