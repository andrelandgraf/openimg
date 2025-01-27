import fs from 'node:fs';

try {
  fs.rmdirSync('./dist', { recursive: true });
} catch { }

await Bun.build({
  entrypoints: ['./src/index.tsx'],
  outdir: './dist',
  target: 'browser',
});
