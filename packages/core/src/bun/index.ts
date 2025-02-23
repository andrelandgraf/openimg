import path from "node:path";
import fs from "node:fs";
import fsp from "node:fs/promises";
import { createReadStream } from "fs";
import { Readable } from "node:stream";
import sharp from "sharp";
import { exists } from "./utils";
import invariant, {
  Config,
  getCachePath,
  getContentType,
  getImgParams,
  getImgSource,
  ImgParams,
  ImgSource,
  PipelineLock,
  validateImgSource,
} from "../utils";

const pipelineLock = new PipelineLock();

function toWebStream(readable: Readable) {
  return new ReadableStream({
    start(controller) {
      readable.on("data", (chunk) => controller.enqueue(chunk));
      readable.on("end", () => controller.close());
      readable.on("error", (error) => controller.error(error));
    },
    cancel() {
      readable.destroy();
    },
  });
}

function streamFromCache(path: string, headers: Headers) {
  const file = Bun.file(path);
  return new Response(file.stream(), { headers });
}

/**
 * getImgResponse retrieves an image, optimizes it, and returns a HTTP response
 * getImgResponse returns failure responses for 404, 401 and similar cases
 * but may also throw errors if the image is not found or cannot be processed.
 * @param {Request} request - the incoming HTTP request, using the Web Fetch API's Request object
 * @param {Config} config - the config object
 * @returns {Promise<Response>} - a promise resolving to a Response object
 */
export async function getImgResponse(request: Request, config: Config = {}) {
  const headers = new Headers(config.headers);

  // Get image parameters (src, width, height, fit, format) from the request
  const paramsRes = config.getImgParams
    ? await config.getImgParams({ request })
    : getImgParams({ request });
  if (paramsRes instanceof Response) {
    return paramsRes;
  }
  const params: ImgParams = paramsRes;

  headers.set("Content-Type", getContentType(params.format));

  // Map src to location of the original image (fs or fetch)
  const sourceRes = config.getImgSource
    ? await config.getImgSource({ request, params })
    : getImgSource({ request, params });
  if (sourceRes instanceof Response) {
    return sourceRes;
  }
  const source: ImgSource = sourceRes;

  // Validate the image source against the allowlisted origins
  const res = validateImgSource(source, config.allowlistedOrigins);
  if (res instanceof Response) {
    return res;
  }

  const cachePath =
    config.cacheFolder !== "no_cache"
      ? getCachePath({ params, source, cacheFolder: config.cacheFolder })
      : null;
  try {
    if (config.cacheFolder !== "no_cache") {
      invariant(cachePath, "Cache path is required");
      const lock = pipelineLock.get(cachePath);
      if (lock) {
        // Wait for ongoing pipeline to finish that writes to the same cache file
        await lock;
      }

      const fileInCache = await exists(cachePath);
      if (fileInCache) {
        return streamFromCache(cachePath, headers);
      }

      // Register ongoing write to the cache file
      pipelineLock.add(cachePath);
    }

    let nodeStream: Readable;
    if (source.type === "fetch") {
      const fetchRes = await fetch(source.url, { headers: source.headers });
      if (!fetchRes.ok || !fetchRes.body) {
        pipelineLock.resolve(cachePath);
        return new Response(fetchRes.statusText || "Image not found", {
          status: fetchRes.status || 404,
        });
      }
      nodeStream = Readable.fromWeb(fetchRes.body as any);
    } else {
      if (!(await exists(source.path))) {
        pipelineLock.resolve(cachePath);
        return new Response("Image not found", { status: 404 });
      }
      nodeStream = createReadStream(source.path);
    }

    const pipeline = sharp();
    if (params.format === "avif") {
      pipeline.avif();
    } else if (params.format === "webp") {
      pipeline.webp();
    }

    if (params.width && params.height) {
      pipeline.resize(params.width, params.height, { fit: params.fit });
    }

    if (config.cacheFolder !== "no_cache") {
      invariant(cachePath, "Cache path is required");
      await fsp
        .mkdir(path.dirname(cachePath), { recursive: true })
        .catch(() => {});

      await new Promise<void>((resolve, reject) => {
        const writeStream = fs.createWriteStream(cachePath);
        nodeStream
          .pipe(pipeline)
          .on("error", reject)
          .pipe(writeStream)
          .on("error", reject)
          .on("finish", resolve);
      });

      pipelineLock.resolve(cachePath);
      return streamFromCache(cachePath, headers);
    }

    return new Response(toWebStream(nodeStream.pipe(pipeline)), { headers });
  } catch (e: unknown) {
    pipelineLock.resolve(cachePath);
    throw new Error(`Error while processing the image request`, {
      cause: e,
    });
  }
}
