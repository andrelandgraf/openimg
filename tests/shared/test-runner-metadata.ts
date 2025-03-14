import { expect, test } from "bun:test";
import { createReadStream, readFileSync } from "fs";
import { Readable } from "stream";

// Expected metadata for cat.png
const EXPECTED_METADATA = { width: 4284, height: 5712, format: "png" };

type MetadataConfig = {
  type: "bun" | "node";
  getImgMetadata: (
    input: any
  ) => Promise<{ width: number; height: number; format: string }>;
};

export function runMetadataTests(config: MetadataConfig) {
  const { type, getImgMetadata } = config;

  test(`${type}: getImgMetadata returns meta data when called with stream`, async () => {
    const stream = createReadStream("./public/cat.png");
    const meta = await getImgMetadata(stream);
    expect(meta).toEqual(EXPECTED_METADATA);
  });

  test(`${type}: getImgMetadata returns meta data when called with buffer`, async () => {
    const buffer = readFileSync("./public/cat.png");
    const meta = await getImgMetadata(buffer);
    expect(meta).toEqual(EXPECTED_METADATA);
  });

  test(`${type}: getImgMetadata returns meta data when called with web ReadableStream`, async () => {
    const stream = createReadStream("./public/cat.png");
    const webStream = Readable.toWeb(stream);
    const meta = await getImgMetadata(webStream);
    expect(meta).toEqual(EXPECTED_METADATA);
  });
}
