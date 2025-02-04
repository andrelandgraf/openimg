export async function exists(path: string) {
  try {
    const file = Bun.file(path);
    if (file.size === 0 || !(await file.exists())) {
      return false;
    }
  } catch {
    return false;
  }
  return true;
}
