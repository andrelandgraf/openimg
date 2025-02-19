import fs from "node:fs";

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
  format: "esm",
  external: ["react", "react-dom"], // Mark React as external (to not bundle it)
});

await Bun.build({
  entrypoints: ["./src/vite.ts"],
  outdir: "./dist",
  target: "node",
  format: "esm",
  external: ["vite", "sharp"],
});
