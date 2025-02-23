import { $ } from "bun";
import fs from "node:fs";
import { expect, test, afterEach, beforeAll, afterAll } from "bun:test";

const port = 3002;
const origin = `http://localhost:${port}/`;

const portRemote = 3003;
const remote = `http://localhost:${portRemote}`;

beforeAll(async () => {
  try {
    // reset cache folder
    fs.rmdirSync("./data", { recursive: true });
  } catch {}

  console.log("starting server...");

  $`bun run server-fetch-remote.ts`.text();

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

  console.log("starting remote server...");

  $`bun run remote.ts`.text();

  waiting = true;
  const timeoutRemote = setTimeout(() => {
    console.error("could not start or reach server");
    process.exit(1);
  }, 3000);
  while (waiting) {
    try {
      await fetch(remote);
      clearTimeout(timeoutRemote);
      waiting = false;
    } catch (err: unknown) {
      console.log("waiting for server res", err);
      await new Promise((res) => setTimeout(res, 300));
    }
  }
});

afterAll(async () => {
  console.log("shutting down server...");

  const txt2 = await $`kill -9 $(lsof -ti:${portRemote})`.text();
  console.log(txt2);

  const txt1 = await $`kill -9 $(lsof -ti:${port})`.text();
  console.log(txt1);
});

afterEach(() => {
  try {
    // reset cache folder
    fs.rmdirSync("./data", { recursive: true });
  } catch {}
});

test("it caches and returns webp", async () => {
  const res = await fetch(origin + "?src=/cat.png&w=100&h=100&format=webp");
  expect(res.status).toBe(200);
  expect(res.headers.get("Content-Type")).toBe("image/webp");

  const cachedFile = Bun.file(
    "./data/images/localhost-w-100-h-100-fit-base.webp",
  );
  expect(await cachedFile.exists()).toBe(true);
});
