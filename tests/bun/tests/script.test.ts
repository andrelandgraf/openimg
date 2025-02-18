import { expect, test } from "bun:test";
import { getImgPlaceholderFromStream } from "openimg-bun";
import { createReadStream } from "fs";

test("it returns a data URL when calling the placeholder endpoint", async () => {
  const stream = createReadStream("./public/cat.png");
  const placeholder = await getImgPlaceholderFromStream(stream);
  expect(placeholder.startsWith("data:image/png;base64,")).toBe(true);
});
