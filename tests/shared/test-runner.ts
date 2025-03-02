/**
 * Shared test runner for both openimg/bun and openimg/node
 */
import fs from "node:fs";
import { expect, test, afterEach, beforeAll, afterAll } from "bun:test";
import { testCases } from "./test-utils.js";
import { waitForServer } from "./server-utils.js";

type ServerConfig = {
  type: "bun" | "node";
  port: number;
  startServer: () => Promise<any>;
  stopServer: (server: any) => Promise<void>;
  fileExists: (path: string) => Promise<boolean> | boolean;
};

export function runTests(config: ServerConfig) {
  const { type, port, startServer, stopServer, fileExists } = config;
  const origin = `http://localhost:${port}/`;
  let server: any;

  beforeAll(async () => {
    try {
      // reset cache folder
      fs.rmdirSync("./data", { recursive: true });
    } catch {}

    console.log(`starting ${type} server...`);
    server = await startServer();

    // Wait for the server to be ready
    await waitForServer(origin);
  });

  afterAll(async () => {
    console.log(`shutting down ${type} server...`);
    await stopServer(server);
  });

  afterEach(() => {
    try {
      // reset cache folder
      fs.rmdirSync("./data", { recursive: true });
    } catch {}
  });

  test(`${type}: it returns 404 if the img path maps to not image in the public folder`, async () => {
    const { url, expectedStatus } = testCases.notFoundImage;
    const res = await fetch(origin + url);
    expect(res.status).toBe(expectedStatus);
  });

  test(`${type}: it returns 403 if the img path maps to an remote origin not in allowlist`, async () => {
    const { url, expectedStatus } = testCases.forbiddenRemoteOrigin;
    const res = await fetch(origin + url);
    expect(res.status).toBe(expectedStatus);
  });

  test(`${type}: it caches and returns webp`, async () => {
    const { url, expectedStatus, expectedContentType, expectedCachePath } =
      testCases.webpFormat;
    const res = await fetch(origin + url);
    expect(res.status).toBe(expectedStatus);
    expect(res.headers.get("Content-Type")).toBe(expectedContentType);

    const exists = await Promise.resolve(fileExists(expectedCachePath));
    expect(exists).toBe(true);
  });

  test(`${type}: it caches and returns avif`, async () => {
    const { url, expectedStatus, expectedContentType, expectedCachePath } =
      testCases.avifFormat;
    const res = await fetch(origin + url);
    expect(res.status).toBe(expectedStatus);
    expect(res.headers.get("Content-Type")).toBe(expectedContentType);

    const exists = await Promise.resolve(fileExists(expectedCachePath));
    expect(exists).toBe(true);
  });

  test(`${type}: it caches and returns original format`, async () => {
    const { url, expectedStatus, expectedContentType, expectedCachePath } =
      testCases.originalFormat;
    const res = await fetch(origin + url);
    expect(res.status).toBe(expectedStatus);
    expect(res.headers.get("Content-Type")).toBe(expectedContentType);

    const exists = await Promise.resolve(fileExists(expectedCachePath));
    expect(exists).toBe(true);
  });

  test(`${type}: it returns custom headers`, async () => {
    const { url, expectedStatus, expectedHeaders } = testCases.customHeaders;
    const res = await fetch(origin + url);
    expect(res.status).toBe(expectedStatus);

    for (const [key, value] of Object.entries(expectedHeaders)) {
      expect(res.headers.get(key)).toBe(value);
    }
  });
}
