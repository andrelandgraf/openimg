import { runFetchRemoteTests } from "../../shared/test-runner-fetch-remote.js";
import { type Subprocess } from "bun";
import fs from "node:fs";

// Configure the Bun-specific server setup for fetch-remote tests
runFetchRemoteTests({
  type: "bun",
  port: 3002,
  remotePort: 3003,
  startServer: async () => {
    // Start the server as a subprocess and store the reference
    const serverProcess = Bun.spawn(["bun", "run", "server-fetch-remote.ts"], {
      stdout: "inherit",
      stderr: "inherit",
    });

    return serverProcess;
  },
  startRemoteServer: async () => {
    // Start the remote server as a subprocess and store the reference
    const remoteServerProcess = Bun.spawn(["bun", "run", "remote.ts"], {
      stdout: "inherit",
      stderr: "inherit",
    });

    return remoteServerProcess;
  },
  stopServer: async (serverProcess: Subprocess) => {
    if (serverProcess) {
      // Kill only the server process we started
      serverProcess.kill();
    }
  },
  stopRemoteServer: async (remoteServerProcess: Subprocess) => {
    if (remoteServerProcess) {
      // Kill the remote server process
      remoteServerProcess.kill();
    }
  },
  fileExists: async (path: string) => {
    return await Bun.file(path).exists();
  },
});
