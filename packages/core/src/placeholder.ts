import { Readable } from "node:stream";
import sharp from "sharp";
import { rgbaToThumbHash, thumbHashToDataURL } from "thumbhash";

/**
 * Converts an image stream to a ThumbHash PNG data URL.
 *
 * @param {Readable | Buffer<ArrayBufferLike> | Uint8Array<ArrayBufferLike>} input - The readable stream or buffer of the original image.
 * @returns {Promise<string>} string containing the data URL placeholder image.
 */
export async function getImgPlaceholder(
  input: Readable | Buffer<ArrayBufferLike> | Uint8Array<ArrayBufferLike>,
) {
  const pipeline =
    input instanceof Buffer || input instanceof Uint8Array
      ? sharp(input)
      : sharp();
  pipeline
    .ensureAlpha() // Ensure the image has an alpha channel
    .resize(100, 100, { fit: "inside" }) // Resize to max 100x100
    .raw();

  if (input instanceof Readable) {
    // Pipe the incoming stream into the Sharp pipeline.
    input.pipe(pipeline);
  }

  const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
  const thumbHash = rgbaToThumbHash(info.width, info.height, data);
  return thumbHashToDataURL(thumbHash);
}
