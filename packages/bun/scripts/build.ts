import fs from "node:fs";

try {
  fs.rmdirSync("./dist", { recursive: true });
} catch {}

await Bun.build({
  entrypoints: ["./src/index.ts"],
  outdir: "./dist",
  target: "bun",
  format: "esm",
  packages: "bundle",
  external: ["sharp"],
});
