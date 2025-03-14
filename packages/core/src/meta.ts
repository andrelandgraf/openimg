import { Readable } from "node:stream";
import sharp from "sharp";
import invariant, { fromWebStream } from "./utils";
import { type ImgData } from "./utils";

export type Metadata = {
  width: number;
  height: number;
  format: string;
};

/**
 * Retrieves the metadata of an image.
 *
 * @param {ImgData} input - The readable stream or buffer of the image.
 * @returns {Promise<Metadata>} object containing the width, height, and format of the image.
 */
export async function getImgMetadata(input: ImgData): Promise<Metadata> {
  const pipeline =
    input instanceof Buffer || input instanceof Uint8Array
      ? sharp(input)
      : sharp();

  if (input instanceof Readable || input instanceof ReadableStream) {
    let stream: Readable;
    if (input instanceof ReadableStream) {
      stream = fromWebStream(input);
    } else {
      stream = input;
    }
    // Pipe the incoming stream into the Sharp pipeline.
    stream.pipe(pipeline);
  }

  const { width, height, format } = await pipeline.metadata();
  invariant(width && height && format, "Failed to retrieve image metadata.");
  return { width, height, format };
}
