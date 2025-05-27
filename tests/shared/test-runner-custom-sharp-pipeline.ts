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

export function runCustomSharpPipelineTests(config: ServerConfig) {
  const { type, port, startServer, stopServer, fileExists } = config;
  const origin = `http://localhost:${port}/`;
  let server: any;

  beforeAll(async () => {
    try {
      // reset cache folder
      fs.rmdirSync("./data", { recursive: true });
    } catch {}

    console.log(`starting ${type} custom-sharp-pipeline server...`);
    server = await startServer();

    // Wait for the server to be ready
    await waitForServer(origin);
  });

  afterAll(async () => {
    console.log(`shutting down ${type} custom-sharp-pipeline server...`);
    await stopServer(server);
  });

  test(`${type}: (custom-sharp-pipeline) it applies black & white filter with custom cache key`, async () => {
    const res = await fetch(
      origin + "?src=/cat.png&w=100&h=100&format=webp&bw=true"
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/webp");

    // Check that the custom cache key is used (with -bw suffix)
    const exists = await Promise.resolve(
      fileExists("./data/images/public/cat-png-bw-w-100-h-100-fit-base.webp")
    );
    expect(exists).toBe(true);

    // Test that cache is served on second request
    const resFromCache = await fetch(
      origin + "?src=/cat.png&w=100&h=100&format=webp&bw=true"
    );
    expect(resFromCache.status).toBe(200);
    expect(resFromCache.headers.get("Content-Type")).toBe("image/webp");
  });

  test(`${type}: (custom-sharp-pipeline) it uses different cache for normal vs black & white`, async () => {
    // Normal image
    const resNormal = await fetch(
      origin + "?src=/cat.png&w=100&h=100&format=webp"
    );
    expect(resNormal.status).toBe(200);

    // Black & white image
    const resBW = await fetch(
      origin + "?src=/cat.png&w=100&h=100&format=webp&bw=true"
    );
    expect(resBW.status).toBe(200);

    // Check that both cache files exist with different names
    const normalExists = await Promise.resolve(
      fileExists("./data/images/public/cat-png-w-100-h-100-fit-base.webp")
    );
    const bwExists = await Promise.resolve(
      fileExists("./data/images/public/cat-png-bw-w-100-h-100-fit-base.webp")
    );

    expect(normalExists).toBe(true);
    expect(bwExists).toBe(true);
  });

  test(`${type}: (custom-sharp-pipeline) it applies high quality pipeline with custom cache key`, async () => {
    const res = await fetch(
      origin + "?src=/cat.png&w=200&h=200&format=webp&hq=true"
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/webp");

    // Check that the high quality cache key is used (with -hq suffix)
    const exists = await Promise.resolve(
      fileExists("./data/images/public/cat-png-hq-w-200-h-200-fit-base.webp")
    );
    expect(exists).toBe(true);
  });

  test(`${type}: (custom-sharp-pipeline) it falls back to default pipeline when no custom parameters`, async () => {
    const res = await fetch(origin + "?src=/cat.png&w=150&h=150&format=avif");
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/avif");

    // Check that default cache path is used (no custom suffix)
    const exists = await Promise.resolve(
      fileExists("./data/images/public/cat-png-w-150-h-150-fit-base.avif")
    );
    expect(exists).toBe(true);
  });

  test(`${type}: (custom-sharp-pipeline) it handles sepia filter with custom format`, async () => {
    const res = await fetch(
      origin + "?src=/cat.png&w=120&h=120&format=avif&sepia=true"
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/avif");

    // Check that the sepia cache key is used (with -sepia suffix)
    const exists = await Promise.resolve(
      fileExists("./data/images/public/cat-png-sepia-w-120-h-120-fit-base.avif")
    );
    expect(exists).toBe(true);
  });

  test(`${type}: (custom-sharp-pipeline) it handles multiple filters combined`, async () => {
    const res = await fetch(
      origin + "?src=/cat.png&w=80&h=80&format=png&sepia=true&hq=true"
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/png");

    // Check that combined cache key is used (both sepia and hq)
    const exists = await Promise.resolve(
      fileExists("./data/images/public/cat-png-hq-sepia-w-80-h-80-fit-base.png")
    );
    expect(exists).toBe(true);
  });
}
