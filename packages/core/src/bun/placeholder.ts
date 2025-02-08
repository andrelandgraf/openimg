import { Readable } from "node:stream";
import { createReadStream } from "node:fs";
import sharp from "sharp";
import { rgbaToThumbHash, thumbHashToDataURL } from "thumbhash";
import { parseUrl, getImgSources } from "../utils";
import { exists } from "./utils";

/**
 * Configuration values for the getImgResponse function.
 * - publicFolder: Default: "./public". Set to "no_public" for remote only origins.
 * - allowlistedOrigins: Default: []. List of allowed origins. If empty, no remote origins will be allowed and only relative pathnames are permitted (e.g., /cat.png).
 *   Example allowlist: ['https://example.com', 'http://localhost:3000']
 *   Adding an '*' entry, ['*'], allows all remote origins.
 */
type GetImgPlaceholderResponseConfig = {
  publicFolder?: string | "no_public"; // default: "./public".
  allowlistedOrigins?: string[]; // default: []
};

/**
 * Generates a placeholder image as a PNG data URL.
 * @param request - the incoming HTTP request
 * @returns - Response containing the placeholder image data URL
 */
export async function getImgPlaceholderResponse(
  request: Request,
  config: GetImgPlaceholderResponseConfig = {},
) {
  const publicFolder = config.publicFolder || "./public";
  const allowlistedOrigins = config.allowlistedOrigins || [];

  const res = getImgSources(
    request,
    {},
    { publicFolder, allowlistedOrigins, cacheFolder: "no_cache" },
  );
  if (res instanceof Response) return res;

  const { originalSrc } = res;
  const srcUrl = parseUrl(originalSrc);
  let nodeStream: Readable;
  if (srcUrl) {
    const fetchRes = await fetch(originalSrc);
    if (!fetchRes.ok || !fetchRes.body) {
      return new Response(fetchRes.statusText || "Image not found", {
        status: fetchRes.status || 404,
      });
    }
    nodeStream = Readable.fromWeb(fetchRes.body as any);
  } else {
    if (!(await exists(originalSrc))) {
      return new Response("Image not found", { status: 404 });
    }
    nodeStream = createReadStream(originalSrc);
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
