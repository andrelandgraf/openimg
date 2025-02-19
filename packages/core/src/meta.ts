import { Readable } from "node:stream";
import sharp from "sharp";
import invariant from "./utils";

export type Metadata = {
  width: number;
  height: number;
  format: string;
};

/**
 * Retrieves the metadata of an image.
 *
 * @param {Readable | Buffer<ArrayBufferLike>  | Uint8Array<ArrayBufferLike>} input - The readable stream or buffer of the original image.
 * @returns {Promise<Metadata>} object containing the width, height, and format of the image.
 */
export async function getImgMetadata(
  input: Readable | Buffer<ArrayBufferLike> | Uint8Array<ArrayBufferLike>,
): Promise<Metadata> {
  const pipeline =
    input instanceof Buffer || input instanceof Uint8Array
      ? sharp(input)
      : sharp();

  if (input instanceof Readable) {
    // Pipe the incoming stream into the Sharp pipeline.
    input.pipe(pipeline);
  }

  const { width, height, format } = await pipeline.metadata();
  invariant(width && height && format, "Failed to retrieve image metadata.");
  return { width, height, format };
}
