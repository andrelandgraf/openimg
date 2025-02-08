import { Readable } from "node:stream";
import { createReadStream } from "node:fs";
import sharp from "sharp";
import { rgbaToThumbHash, thumbHashToDataURL } from "thumbhash";
import { parseUrl } from "../utils";
import { exists } from "./utils";

/**
 * Generates a placeholder image as a PNG data URL.
 * @param request - the incoming HTTP request
 * @returns - Response containing the placeholder image data URL
 */
export async function getImgPlaceholderResponse(request: Request) {
  const url = new URL(request.url);
  const src = url.searchParams.get("src");
  if (!src) {
    return new Response(null, {
      status: 400,
      statusText: 'Search param "src" must be set',
    });
  }

  const srcUrl = parseUrl(src);
  let nodeStream: Readable;
  if (srcUrl) {
    const fetchRes = await fetch(src);
    if (!fetchRes.ok || !fetchRes.body) {
      return new Response(fetchRes.statusText || "Image not found", {
        status: fetchRes.status || 404,
      });
    }
    nodeStream = Readable.fromWeb(fetchRes.body as any);
  } else {
    if (!(await exists(src))) {
      return new Response("Image not found", { status: 404 });
    }
    nodeStream = createReadStream(src);
  }

  const dataUrl = await getImgPlaceholderFromStream(nodeStream);
  return new Response(dataUrl, {
    headers: {
      "Content-Type": "image/png",
    },
  });
}

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
