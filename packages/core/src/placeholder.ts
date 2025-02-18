import { Readable } from "node:stream";
import sharp from "sharp";
import { rgbaToThumbHash, thumbHashToDataURL } from "thumbhash";

/**
 * Converts an image stream to a ThumbHash-based PNG data URL.
 *
 * @param nodeStream - The readable stream of the original image.
 * @returns - Promise<string> containing the placeholder image data URL
 */
export async function getImgPlaceholderFromStream(nodeStream: Readable) {
  const pipeline = sharp();
  pipeline
    .ensureAlpha() // Ensure the image has an alpha channel
    .resize(100, 100, { fit: "inside" }) // Resize to max 100x100
    .raw();

  // Pipe the incoming stream into the Sharp pipeline.
  nodeStream.pipe(pipeline);

  // Pipe the incoming stream into sharp and process it
  const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
  const { width, height } = info;

  // Generate the ThumbHash
  const thumbHash = rgbaToThumbHash(width, height, data);

  // Convert ThumbHash to a PNG data URL
  return thumbHashToDataURL(thumbHash);
}
