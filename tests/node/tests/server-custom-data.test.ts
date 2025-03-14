import { type Subprocess } from "bun";
import fs from "node:fs";
import { runCustomDataTests } from "../../shared/test-runner-custom-data.ts";

// Configure the Node.js-specific server setup
runCustomDataTests({
  type: "node",
  port: 3006,
  startServer: async () => {
    // Start the server as a subprocess and store the reference
    const serverProcess = Bun.spawn(["bunx", "tsx", "server-custom-data.ts"], {
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
