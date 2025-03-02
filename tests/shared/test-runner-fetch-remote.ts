import fs from "node:fs";
import { expect, test, afterEach, beforeAll, afterAll } from "bun:test";
import { waitForServer } from "./utils.ts";

type ServerConfig = {
  type: "bun" | "node";
  port: number;
  remotePort: number;
  startServer: () => Promise<any>;
  startRemoteServer: () => Promise<any>;
  stopServer: (server: any) => Promise<void>;
  stopRemoteServer: (server: any) => Promise<void>;
  fileExists: (path: string) => Promise<boolean> | boolean;
};

export function runFetchRemoteTests(config: ServerConfig) {
  const {
    type,
    port,
    remotePort,
    startServer,
    startRemoteServer,
    stopServer,
    stopRemoteServer,
    fileExists,
  } = config;

  const origin = `http://localhost:${port}/`;
  const remote = `http://localhost:${remotePort}/`;

  let server: any;
  let remoteServer: any;

  beforeAll(async () => {
    try {
      // reset cache folder
      fs.rmdirSync("./data", { recursive: true });
    } catch {}

    console.log(`starting ${type} server...`);
    server = await startServer();

    // Wait for the server to be ready
    await waitForServer(origin);

    console.log(`starting ${type} remote server...`);
    remoteServer = await startRemoteServer();

    // Wait for the remote server to be ready
    await waitForServer(remote);
  });

  afterAll(async () => {
    console.log(`shutting down ${type} servers...`);

    await stopRemoteServer(remoteServer);
    console.log("Remote server process terminated");

    await stopServer(server);
    console.log("Server process terminated");
  });

  afterEach(() => {
    try {
      // reset cache folder
      fs.rmdirSync("./data", { recursive: true });
    } catch {}
  });

  test(`${type}: (fetch remote) it caches and returns webp`, async () => {
    const res = await fetch(origin + "?src=/cat.png&w=100&h=100&format=webp");
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/webp");

    const exists = await Promise.resolve(
      fileExists("./data/images/localhost-w-100-h-100-fit-base.webp")
    );
    expect(exists).toBe(true);
  });
}
