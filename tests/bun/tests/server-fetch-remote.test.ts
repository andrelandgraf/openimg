import fs from "node:fs";
import { expect, test, afterEach, beforeAll, afterAll } from "bun:test";
import { type Subprocess } from "bun";

const port = 3002;
const origin = `http://localhost:${port}/`;

const portRemote = 3003;
const remote = `http://localhost:${portRemote}`;

let serverProcess: Subprocess | undefined;
let remoteServerProcess: Subprocess | undefined;

beforeAll(async () => {
  try {
    // reset cache folder
    fs.rmdirSync("./data", { recursive: true });
  } catch {}

  console.log("starting server...");

  // Start the server as a subprocess and store the reference
  serverProcess = Bun.spawn(["bun", "run", "server-fetch-remote.ts"], {
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

  console.log("starting remote server...");

  // Start the remote server as a subprocess and store the reference
  remoteServerProcess = Bun.spawn(["bun", "run", "remote.ts"], {
    stdout: "inherit",
    stderr: "inherit",
  });

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
  console.log("shutting down servers...");

  if (remoteServerProcess) {
    // Kill the remote server process
    remoteServerProcess.kill();
    console.log("Remote server process terminated");
  }

  if (serverProcess) {
    // Kill the main server process
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

test("it caches and returns webp", async () => {
  const res = await fetch(origin + "?src=/cat.png&w=100&h=100&format=webp");
  expect(res.status).toBe(200);
  expect(res.headers.get("Content-Type")).toBe("image/webp");

  const cachedFile = Bun.file(
    "./data/images/localhost-w-100-h-100-fit-base.webp"
  );
  expect(await cachedFile.exists()).toBe(true);
});
