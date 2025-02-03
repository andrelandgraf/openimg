import { $ } from "bun";
import fs from "node:fs";
import { expect, test, afterEach, beforeAll, afterAll } from "bun:test";

const origin = "http://localhost:3000/";

beforeAll(async () => {
  console.log("starting server...");

  $`bun run server.ts`.text();

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

  const txt = await $`kill -9 $(lsof -ti:3000)`.text();
  console.log(txt);
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

test("it caches and returns webp", async () => {
  const res = await fetch(origin + "?src=/cat.png&w=100&h=100&format=webp");
  expect(res.status).toBe(200);
  expect(res.headers.get("Content-Type")).toBe("image/webp");

  const cachedFile = Bun.file(
    "./data/images/cat-png-w-100-h-100-fit-base.webp",
  );
  expect(await cachedFile.exists()).toBe(true);
});

test("it caches and returns avif", async () => {
  const res = await fetch(origin + "?src=/cat.png&w=100&h=100&format=avif");
  expect(res.status).toBe(200);
  expect(res.headers.get("Content-Type")).toBe("image/avif");

  const cachedFile = Bun.file(
    "./data/images/cat-png-w-100-h-100-fit-base.avif",
  );
  expect(await cachedFile.exists()).toBe(true);
});

test("it caches and returns original format", async () => {
  const res = await fetch(origin + "?src=/cat.png&w=100&h=100");
  expect(res.status).toBe(200);
  expect(res.headers.get("Content-Type")).toBe("image/png");

  const cachedFile = Bun.file("./data/images/cat-png-w-100-h-100-fit-base.png");
  expect(await cachedFile.exists()).toBe(true);
});
