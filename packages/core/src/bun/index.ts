import { createReadStream } from "fs";
import { PassThrough, Readable } from "node:stream";
import sharp from "sharp";
import { exists, FileCache } from "./utils";
import invariant, {
  Config,
  DEFAULT_CACHE_FOLDER,
  fromWebStream,
  getCachePath,
  getContentType,
  getImgParams,
  getImgSource,
  ImgParams,
  ImgSource,
  PipelineLock,
  toWebStream,
  validateImgSource,
} from "../utils";

const pipelineLock = new PipelineLock();
const caches = new Map<string, FileCache>();

/**
 * getImgResponse retrieves an image, optimizes it, and returns a HTTP response
 * it returns failure responses for 404, 401 and similar cases
 * but may also throw errors if the image is not found or cannot be processed
 * or if the config options are invalid.
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

  // Map src to location of the original image (fs or fetch)
  const sourceRes = config.getImgSource
    ? await config.getImgSource({ request, params })
    : getImgSource({ request, params });
  if (sourceRes instanceof Response) {
    return sourceRes;
  }
  const source: ImgSource = sourceRes;

  // Validate the image source against the allowlisted origins and other config options
  const res = validateImgSource(source, config);
  if (res instanceof Response) {
    return res;
  }

  if (config.cacheFolder !== "no_cache") {
    const cacheFolder = config.cacheFolder || DEFAULT_CACHE_FOLDER;
    let cache = caches.get(cacheFolder);
    if (!cache) {
      caches.set(cacheFolder, new FileCache(cacheFolder));
    }
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

      const cache = caches.get(config.cacheFolder || DEFAULT_CACHE_FOLDER);
      invariant(cache, "Cache is required");
      if (cache.hasFile(cachePath)) {
        return cache.streamFromCache(cachePath, headers);
      }

      // Register ongoing write to the cache file
      pipelineLock.add(cachePath);
    }

    let readStream: Readable;
    if (source.type === "fetch") {
      const fetchRes = await fetch(source.url, { headers: source.headers });
      if (!fetchRes.ok || !fetchRes.body) {
        pipelineLock.resolve(cachePath);
        return new Response(null, {
          status: fetchRes.status || 404,
          statusText: fetchRes.statusText || "Image not found",
        });
      }
      readStream = fromWebStream(fetchRes.body);
    } else if (source.type === "fs") {
      if (!exists(source.path)) {
        pipelineLock.resolve(cachePath);
        return new Response(null, {
          status: 404,
          statusText: "Image not found",
        });
      }
      readStream = createReadStream(source.path);
    } else {
      // type === "data"
      if (source.data instanceof Readable) {
        readStream = source.data;
      } else if (source.data instanceof ReadableStream) {
        readStream = fromWebStream(source.data);
      } else {
        readStream = Readable.from(source.data);
      }
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

    if (config.transform) {
      const transformRes = await config.transform({ request,pipeline, params });
      if (transformRes instanceof Response) {
        return transformRes;
      }
    }

    const infoPromise = new Promise<sharp.OutputInfo>((resolve) => {
      pipeline.on("info", (info) => {
        resolve(info);
      });
    });

    const transformed = readStream.pipe(pipeline);
    const outputStream = new PassThrough();
    transformed.pipe(outputStream);

    const outputImgInfo = await infoPromise;

    if (config.cacheFolder !== "no_cache") {
      invariant(cachePath, "Cache path is required");

      const cache = caches.get(config.cacheFolder || DEFAULT_CACHE_FOLDER);
      invariant(cache, "Cache is required");
      await cache.streamToCache(cachePath, outputStream, {
        size: outputImgInfo.size,
        contentType: getContentType(outputImgInfo.format),
      });

      pipelineLock.resolve(cachePath);
      return cache.streamFromCache(cachePath, headers);
    }

    headers.set("Content-Type", getContentType(outputImgInfo.format));
    headers.set("Content-Length", outputImgInfo.size.toString());
    return new Response(toWebStream(outputStream), {
      headers,
    });
  } catch (e: unknown) {
    pipelineLock.resolve(cachePath);
    throw new Error(`Error while processing the image request`, {
      cause: e,
    });
  }
}
