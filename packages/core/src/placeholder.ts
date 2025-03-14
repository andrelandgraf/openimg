import sharp from "sharp";
import { rgbaToThumbHash, thumbHashToDataURL } from "thumbhash";
import { Readable } from "node:stream";
import { fromWebStream, type ImgData } from "./utils";

/**
 * Converts an image stream to a ThumbHash PNG data URL.
 *
 * @param {ImgData} input - The readable stream or buffer of the image.
 * @returns {Promise<string>} string containing the data URL placeholder image.
 */
export async function getImgPlaceholder(input: ImgData) {
  const pipeline =
    input instanceof Buffer || input instanceof Uint8Array
      ? sharp(input)
      : sharp();
  pipeline
    .ensureAlpha() // Ensure the image has an alpha channel
    .resize(100, 100, { fit: "inside" }) // Resize to max 100x100
    .raw();

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

  const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
  const thumbHash = rgbaToThumbHash(info.width, info.height, data);
  return thumbHashToDataURL(thumbHash);
}
