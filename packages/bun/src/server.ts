import { getImgResponse } from "./index";

async function main() {
  const configFile = Bun.file("./config.json");
  let config: any = {};
  if (await configFile.exists()) {
    console.log("Found config file...");
    config = await configFile.json();
  } else {
    console.log("No config file found, using defaults...");
  }
  const hostname = config.hostname || "localhost";
  const port = config.port || 3000;
  const configValues = {
    publicFolderPath: config?.publicFolderPath || "./public",
    allowlistedOrigins: config?.allowlistedOrigins || [],
  } as const;
  console.log("Following config values will be used:", configValues);

  Bun.serve({
    hostname,
    port,
    async fetch(req) {
      try {
        const headers = new Headers();
        headers.set("Cache-Control", "public, max-age=31536000, immutable");
        return getImgResponse(req, {
          ...configValues,
          headers,
        });
      } catch (err: unknown) {
        console.error(err);
        return new Response("Internal Server Error", { status: 500 });
      }
    },
  });

  console.log(`Server listening on http://${hostname}:${port}`);
}

main();
