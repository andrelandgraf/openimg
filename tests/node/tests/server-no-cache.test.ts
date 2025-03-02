import { runNoCacheTests } from "../../shared/test-runner-no-cache.ts";
import { type Subprocess } from "bun";
import fs from "node:fs";

// Configure the Node.js-specific server setup
runNoCacheTests({
  type: "node",
  port: 3001,
  startServer: async () => {
    // Start the server as a subprocess and store the reference
    const serverProcess = Bun.spawn(["bunx", "tsx", "server-no-cache.ts"], {
      stdout: "inherit",
      stderr: "inherit",
    });

    return serverProcess;
  },
  stopServer: async (serverProcess: Subprocess) => {
    if (serverProcess) {
      // Kill only the server process we started
      serverProcess.kill();
      console.log("Server process terminated");
    }
  },
  fileExists: (path: string) => {
    return fs.existsSync(path);
  },
});
