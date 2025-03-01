import fs from "node:fs";
import { expect, test, afterEach, beforeAll, afterAll } from "bun:test";
import { type Subprocess } from "bun";

const port = 3000;
const origin = `http://localhost:${port}/`;
let serverProcess: Subprocess | undefined;

beforeAll(async () => {
  try {
    // reset cache folder
    fs.rmdirSync("./data", { recursive: true });
  } catch {}

  console.log("starting server...");

  // Start the server as a subprocess and store the reference
  serverProcess = Bun.spawn(["bun", "run", "server.ts"], {
    stdout: "inherit",
    stderr: "inherit",
  });

  let waiting = true;
  const timeout = setTimeout(() => {
    console.error("could not start or reach server");
    process.exit(1);
  }, 3000);
  while (waiting) {
    try {
      await fetch(origin);
      clearTimeout(timeout);
      waiting = false;
    } catch (err: unknown) {
      console.log("waiting for server res", err);
      await new Promise((res) => setTimeout(res, 300));
    }
  }
});

afterAll(async () => {
  console.log("shutting down server...");
  
  if (serverProcess) {
    // Kill only the server process we started
    serverProcess.kill();
    console.log("Server process terminated");
  }
});

afterEach(() => {
  try {
    // reset cache folder
    fs.rmdirSync("./data", { recursive: true });
  } catch {}
});

test("it returns 404 if the img path maps to not image in the public folder", async () => {
  const res = await fetch(origin + "?src=/cat2.png&w=100&h=100&format=avif");
  expect(res.status).toBe(404);
});

test("it returns 403 if the img path maps to an remote origin not in allowlist", async () => {
  const res = await fetch(
    origin + "?src=https://example.com/cat2.png&w=100&h=100&format=avif"
  );
  expect(res.status).toBe(403);
});

test("it caches and returns webp", async () => {
  const res = await fetch(origin + "?src=/cat.png&w=100&h=100&format=webp");
  expect(res.status).toBe(200);
  expect(res.headers.get("Content-Type")).toBe("image/webp");

  const cachedFile = Bun.file(
    "./data/images/public/cat-png-w-100-h-100-fit-base.webp"
  );
  expect(await cachedFile.exists()).toBe(true);
});

test("it caches and returns avif", async () => {
  const res = await fetch(origin + "?src=/cat.png&w=100&h=100&format=avif");
  expect(res.status).toBe(200);
  expect(res.headers.get("Content-Type")).toBe("image/avif");

  const cachedFile = Bun.file(
    "./data/images/public/cat-png-w-100-h-100-fit-base.avif"
  );
  expect(await cachedFile.exists()).toBe(true);
});

test("it caches and returns original format", async () => {
  const res = await fetch(origin + "?src=/cat.png&w=100&h=100");
  expect(res.status).toBe(200);
  expect(res.headers.get("Content-Type")).toBe("image/jpeg");

  const cachedFile = Bun.file(
    "./data/images/public/cat-png-w-100-h-100-fit-base.png"
  );
  expect(await cachedFile.exists()).toBe(true);
});

test("it returns custom headers", async () => {
  const res = await fetch(origin + "?src=/cat.png&w=100&h=100&format=webp");
  expect(res.status).toBe(200);
  expect(res.headers.get("x-openimg-test")).toBe("true");
});
