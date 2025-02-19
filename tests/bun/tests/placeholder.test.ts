import { expect, test } from "bun:test";
import { getImgPlaceholder } from "openimg/bun";
import { createReadStream, readFileSync } from "fs";

test("it returns a data URL when calling the placeholder fn with stream", async () => {
  const stream = createReadStream("./public/cat.png");
  const placeholder = await getImgPlaceholder(stream);
  expect(placeholder.startsWith("data:image/png;base64,")).toBe(true);
});

test("it returns a data URL when calling the placeholder fn with buffer", async () => {
  const buffer = readFileSync("./public/cat.png");
  const placeholder = await getImgPlaceholder(buffer);
  expect(placeholder.startsWith("data:image/png;base64,")).toBe(true);
});
