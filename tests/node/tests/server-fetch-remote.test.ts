import { runFetchRemoteTests } from "../../shared/test-runner-fetch-remote.ts";
import fs from "node:fs";
import { type Subprocess } from "bun";

// Configure the Node.js-specific server setup for fetch-remote tests
runFetchRemoteTests({
  type: "node",
  port: 3002,
  remotePort: 3003,
  startServer: async () => {
    // Start the server as a subprocess
    const serverProcess = Bun.spawn(["bunx", "tsx", "server-fetch-remote.ts"], {
      stdout: "inherit",
      stderr: "inherit",
    });

    return serverProcess;
  },
  startRemoteServer: async () => {
    // Start the remote server as a subprocess
    const remoteServerProcess = Bun.spawn(["bunx", "tsx", "remote.ts"], {
      stdout: "inherit",
      stderr: "inherit",
    });

    return remoteServerProcess;
  },
  stopServer: async (serverProcess: Subprocess) => {
    if (serverProcess) {
      // Kill the server process
      serverProcess.kill();
    }
  },
  stopRemoteServer: async (remoteServerProcess: Subprocess) => {
    if (remoteServerProcess) {
      // Kill the remote server process
      remoteServerProcess.kill();
    }
  },
  fileExists: (path: string) => {
    return fs.existsSync(path);
  },
});
