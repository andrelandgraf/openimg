import fs from "node:fs";
import { expect, test, beforeAll, afterAll } from "bun:test";
import { testCases } from "./utils.ts";
import { waitForServer } from "./utils.ts";

type ServerConfig = {
  type: "bun" | "node";
  port: number;
  startServer: () => Promise<any>;
  stopServer: (server: any) => Promise<void>;
  fileExists: (path: string) => Promise<boolean> | boolean;
};

export function runNoCacheTests(config: ServerConfig) {
  const { type, port, startServer, stopServer, fileExists } = config;
  const origin = `http://localhost:${port}/`;
  let server: any;

  beforeAll(async () => {
    try {
      // reset cache folder
      fs.rmdirSync("./data", { recursive: true });
    } catch {}

    console.log(`starting ${type} no-cache server...`);
    server = await startServer();

    // Wait for the server to be ready
    await waitForServer(origin);
  });

  afterAll(async () => {
    console.log(`shutting down ${type} no-cache server...`);
    await stopServer(server);
  });

  test(`${type}: (no cache) it returns 404 if the img path maps to not image in the public folder`, async () => {
    const { url, expectedStatus } = testCases.notFoundImage;
    const res = await fetch(origin + url);
    expect(res.status).toBe(expectedStatus);
  });

  test(`${type}: (no cache) it returns 403 if the img path maps to an remote origin not in allowlist`, async () => {
    const { url, expectedStatus } = testCases.forbiddenRemoteOrigin;
    const res = await fetch(origin + url);
    expect(res.status).toBe(expectedStatus);
  });

  test(`${type}: (no cache) it does not cache and returns webp`, async () => {
    const { url, expectedStatus, expectedContentType, expectedCachePath } =
      testCases.webpFormat;
    const res = await fetch(origin + url);
    expect(res.status).toBe(expectedStatus);
    expect(res.headers.get("Content-Type")).toBe(expectedContentType);

    const exists = await Promise.resolve(fileExists(expectedCachePath));
    expect(exists).toBe(false);
  });

  test(`${type}: (no cache) it does not cache and returns avif`, async () => {
    const { url, expectedStatus, expectedContentType, expectedCachePath } =
      testCases.avifFormat;
    const res = await fetch(origin + url);
    expect(res.status).toBe(expectedStatus);
    expect(res.headers.get("Content-Type")).toBe(expectedContentType);

    const exists = await Promise.resolve(fileExists(expectedCachePath));
    expect(exists).toBe(false);
  });

  test(`${type}: (no cache) it does not cache and returns original format`, async () => {
    const { url, expectedStatus, expectedContentType, expectedCachePath } =
      testCases.originalFormat;
    const res = await fetch(origin + url);
    expect(res.status).toBe(expectedStatus);

    const exists = await Promise.resolve(fileExists(expectedCachePath));
    expect(exists).toBe(false);
  });
}
