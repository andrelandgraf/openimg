import { runTests } from "../../shared/test-runner.js";
import { type Subprocess } from "bun";
import fs from "node:fs";

// Configure the Bun-specific server setup
runTests({
  type: "bun",
  port: 3000,
  startServer: async () => {
    // Start the server as a subprocess and store the reference
    const serverProcess = Bun.spawn(["bun", "run", "server.ts"], {
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
  fileExists: async (path: string) => {
    return await Bun.file(path).exists();
  },
});
