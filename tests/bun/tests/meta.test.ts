import { expect, test } from "bun:test";
import { getImgMetadata } from "openimg/bun";
import { createReadStream, readFileSync } from "fs";

test("createReadStream returns meta data when called with stream", async () => {
  const stream = createReadStream("./public/cat.png");
  const meta = await getImgMetadata(stream);
  expect(meta).toEqual({ width: 4284, height: 5712, format: "png" });
});

test("createReadStream returns meta data when called with buffer", async () => {
  const buffer = readFileSync("./public/cat.png");
  const meta = await getImgMetadata(buffer);
  expect(meta).toEqual({ width: 4284, height: 5712, format: "png" });
});
