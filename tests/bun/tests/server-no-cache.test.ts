import { runNoCacheTests } from "../../shared/test-runner-no-cache.js";
import { type Subprocess } from "bun";

// Configure the Bun-specific server setup for no-cache tests
runNoCacheTests({
  type: "bun",
  port: 3001,
  startServer: async () => {
    // Start the server as a subprocess and store the reference
    const serverProcess = Bun.spawn(["bun", "run", "server-no-cache.ts"], {
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
