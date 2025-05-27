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

export function runCustomSharpPipelineNoCacheTests(config: ServerConfig) {
  const { type, port, startServer, stopServer, fileExists } = config;
  const origin = `http://localhost:${port}/`;
  let server: any;

  beforeAll(async () => {
    try {
      // reset cache folder
      fs.rmdirSync("./data", { recursive: true });
    } catch {}

    console.log(`starting ${type} custom-sharp-pipeline-no-cache server...`);
    server = await startServer();

    // Wait for the server to be ready
    await waitForServer(origin);
  });

  afterAll(async () => {
    console.log(
      `shutting down ${type} custom-sharp-pipeline-no-cache server...`
    );
    await stopServer(server);
  });

  test(`${type}: (custom-sharp-pipeline-no-cache) it applies black & white filter without caching`, async () => {
    const res = await fetch(
      origin + "?src=/cat.png&w=100&h=100&format=webp&bw=true"
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/webp");

    // Check that no cache file is created
    const exists = await Promise.resolve(
      fileExists("./data/images/public/cat-png-bw-w-100-h-100-fit-base.webp")
    );
    expect(exists).toBe(false);
  });

  test(`${type}: (custom-sharp-pipeline-no-cache) it applies high quality pipeline without caching`, async () => {
    const res = await fetch(
      origin + "?src=/cat.png&w=200&h=200&format=avif&hq=true"
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/avif");

    // Check that no cache file is created
    const exists = await Promise.resolve(
      fileExists("./data/images/public/cat-png-hq-w-200-h-200-fit-base.avif")
    );
    expect(exists).toBe(false);
  });

  test(`${type}: (custom-sharp-pipeline-no-cache) it applies sepia filter without caching`, async () => {
    const res = await fetch(
      origin + "?src=/cat.png&w=150&h=150&format=png&sepia=true"
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/png");

    // Check that no cache file is created
    const exists = await Promise.resolve(
      fileExists("./data/images/public/cat-png-sepia-w-150-h-150-fit-base.png")
    );
    expect(exists).toBe(false);
  });

  test(`${type}: (custom-sharp-pipeline-no-cache) it falls back to default pipeline without caching`, async () => {
    const res = await fetch(origin + "?src=/cat.png&w=120&h=120&format=webp");
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/webp");

    // Check that no cache file is created
    const exists = await Promise.resolve(
      fileExists("./data/images/public/cat-png-w-120-h-120-fit-base.webp")
    );
    expect(exists).toBe(false);
  });
}
