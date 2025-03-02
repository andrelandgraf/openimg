import { expect, test } from "bun:test";
import { createReadStream, readFileSync } from "fs";

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
    expect(meta).toEqual({ width: 4284, height: 5712, format: "png" });
  });

  test(`${type}: getImgMetadata returns meta data when called with buffer`, async () => {
    const buffer = readFileSync("./public/cat.png");
    const meta = await getImgMetadata(buffer);
    expect(meta).toEqual({ width: 4284, height: 5712, format: "png" });
  });
}
