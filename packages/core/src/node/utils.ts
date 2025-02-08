import fsp from "node:fs/promises";

export async function exists(path: string) {
  try {
    const stats = await fsp.stat(path);
    if (stats.size === 0) {
      return false;
    }
  } catch {
    return false;
  }
  return true;
}
