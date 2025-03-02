/**
 * Shared test runner for placeholder tests (both Bun and Node.js)
 */
import { expect, test } from "bun:test";
import { createReadStream, readFileSync } from "fs";

type PlaceholderConfig = {
  type: "bun" | "node";
  getImgPlaceholder: (input: any) => Promise<string>;
};

export function runPlaceholderTests(config: PlaceholderConfig) {
  const { type, getImgPlaceholder } = config;

  test(`${type}: getImgPlaceholder returns a data URL when calling the placeholder fn with stream`, async () => {
    const stream = createReadStream("./public/cat.png");
    const placeholder = await getImgPlaceholder(stream);
    expect(placeholder.startsWith("data:image/png;base64,")).toBe(true);
  });

  test(`${type}: getImgPlaceholder returns a data URL when calling the placeholder fn with buffer`, async () => {
    const buffer = readFileSync("./public/cat.png");
    const placeholder = await getImgPlaceholder(buffer);
    expect(placeholder.startsWith("data:image/png;base64,")).toBe(true);
  });
}
