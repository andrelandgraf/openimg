import { runCustomSharpPipelineTests } from "../../shared/test-runner-custom-sharp-pipeline.ts";

// Configure the Bun-specific server setup
runCustomSharpPipelineTests({
  type: "bun",
  port: 3007,
  startServer: async () => {
    // Start the server as a subprocess and store the reference
    const serverProcess = Bun.spawn(
      ["bun", "server-custom-sharp-pipeline.ts"],
      {
        stdout: "inherit",
        stderr: "inherit",
      }
    );

    return serverProcess;
  },
  stopServer: async (serverProcess: any) => {
    if (serverProcess) {
      // Kill only the server process we started
      serverProcess.kill();
      console.log("Custom Sharp Pipeline server process terminated");
    }
  },
  fileExists: async (path: string) => {
    return await Bun.file(path).exists();
  },
});
