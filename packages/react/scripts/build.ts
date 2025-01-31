import fs from "node:fs";

try {
  fs.rmdirSync("./dist", { recursive: true });
} catch {}

await Bun.build({
  entrypoints: ["./src/index.tsx"],
  outdir: "./dist",
  target: "browser",
  external: ["react", "react-dom"], // Mark React as external (to not bundle it)
});
