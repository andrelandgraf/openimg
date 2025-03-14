import { type Subprocess } from "bun";
import { runCustomDataTests } from "../../shared/test-runner-custom-data.ts";

// Configure the Bun-specific server setup for no-cache tests
runCustomDataTests({
  type: "bun",
  port: 3006,
  startServer: async () => {
    // Start the server as a subprocess and store the reference
    const serverProcess = Bun.spawn(["bun", "run", "server-custom-data.ts"], {
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
