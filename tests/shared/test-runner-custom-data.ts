import fs from "node:fs";
import { expect, test, beforeAll, afterAll } from "bun:test";
import { waitForServer } from "./utils.ts";

type ServerConfig = {
  type: "bun" | "node";
  port: number;
  startServer: () => Promise<any>;
  stopServer: (server: any) => Promise<void>;
  fileExists: (path: string) => Promise<boolean> | boolean;
};

export function runCustomDataTests(config: ServerConfig) {
  const { type, port, startServer, stopServer, fileExists } = config;
  const origin = `http://localhost:${port}/`;
  let server: any;

  beforeAll(async () => {
    try {
      // reset cache folder
      fs.rmdirSync("./data", { recursive: true });
    } catch {}

    console.log(`starting ${type} custom-data server...`);
    server = await startServer();

    // Wait for the server to be ready
    await waitForServer(origin);
  });

  afterAll(async () => {
    console.log(`shutting down ${type} custom-data server...`);
    await stopServer(server);
  });

  test(`${type}: (custom-data) it caches and returns webp`, async () => {
    const res = await fetch(origin + "/?w=100&h=100&format=webp");
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/webp");

    const exists = await Promise.resolve(
      fileExists("./data/images/cat-w-100-h-100-fit-base.webp")
    );
    expect(exists).toBe(true);

    const resFromCache = await fetch(origin + "/?w=100&h=100&format=webp");
    expect(resFromCache.status).toBe(200);
    expect(resFromCache.headers.get("Content-Type")).toBe("image/webp");
  });

  test(`${type}: (custom-data) it caches and returns avif`, async () => {
    const res = await fetch(origin + "/?w=100&h=100&format=avif");
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/avif");

    const exists = await Promise.resolve(
      fileExists("./data/images/cat-w-100-h-100-fit-base.avif")
    );
    expect(exists).toBe(true);

    const resFromCache = await fetch(origin + "/?w=100&h=100&format=avif");
    expect(resFromCache.status).toBe(200);
    expect(resFromCache.headers.get("Content-Type")).toBe("image/avif");
  });

  test(`${type}: (custom-data) it caches and returns original format`, async () => {
    const res = await fetch(origin + "/?w=100&h=100");
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/png");

    const exists = await Promise.resolve(
      fileExists("./data/images/cat-w-100-h-100-fit-base")
    );
    expect(exists).toBe(true);

    const resFromCache = await fetch(origin + "/?w=100&h=100");
    expect(resFromCache.status).toBe(200);
    expect(resFromCache.headers.get("Content-Type")).toBe("image/png");
  });
}
