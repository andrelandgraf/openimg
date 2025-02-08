import fs from "node:fs";

try {
  fs.rmdirSync("./dist", { recursive: true });
} catch {}

await Bun.build({
  entrypoints: ["./src/bun.ts"],
  outdir: "./dist",
  target: "bun",
  format: "esm",
  packages: "bundle",
  external: ["sharp"],
});

await Bun.build({
  entrypoints: ["./src/node.ts"],
  outdir: "./dist",
  target: "node",
  format: "esm",
  packages: "bundle",
  external: ["sharp"],
});

await Bun.build({
  entrypoints: ["./src/react.ts"],
  outdir: "./dist",
  target: "browser",
  external: ["react", "react-dom"], // Mark React as external (to not bundle it)
});
