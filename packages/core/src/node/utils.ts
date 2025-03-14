import fs, { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import path from "node:path";
import { toWebStream } from "../utils";

export function exists(path: string): { size: number } | false {
  try {
    const stats = fs.statSync(path);
    if (stats.size === 0) {
      return false;
    }
    return { size: stats.size };
  } catch {
    return false;
  }
}

type CacheMetadata = {
  [key: string]: {
    size: number;
    contentType: string;
  };
};

export class FileCache {
  #cacheFolder: string;
  #metadata: CacheMetadata;

  constructor(cacheFolder: string) {
    this.#cacheFolder = cacheFolder;
    // Ensure cache folder exists
    fs.mkdirSync(cacheFolder, { recursive: true });

    const metadataPath = path.join(this.#cacheFolder, "metadata.json");
    if (!exists(metadataPath)) {
      // Create empty metadata file
      fs.writeFileSync(metadataPath, "{}");
      this.#metadata = {};
    } else {
      const metadata = fs.readFileSync(metadataPath, "utf-8");
      this.#metadata = JSON.parse(metadata);
    }
  }

  hasFile(cachePath: string) {
    // enforce fs and cache to be in sync
    // otherwise, refetch the file and update the cache
    return exists(cachePath) && this.#metadata[cachePath];
  }

  streamFromCache(cachePath: string, headers: Headers) {
    const meta = this.#metadata[cachePath];
    if (!meta) {
      throw new Error("Cache miss for " + cachePath);
    }
    headers.set("Content-Type", meta.contentType);
    headers.set("Content-Length", meta.size.toString());
    const nodeStream = createReadStream(cachePath);
    const webStream = toWebStream(nodeStream);
    return new Response(webStream, { headers });
  }

  async streamToCache(
    cachePath: string,
    readable: Readable,
    info: { size: number; contentType: string }
  ) {
    try {
      fs.mkdirSync(path.dirname(cachePath), { recursive: true });
    } catch {
      // Ignore
    }

    return new Promise<void>((resolve, reject) => {
      const writeStream = fs.createWriteStream(cachePath);
      readable
        .pipe(writeStream)
        .on("error", reject)
        .on("finish", () => {
          this.#recordNewFile(cachePath, info);
          resolve();
        });
    });
  }

  #recordNewFile(
    cachePath: string,
    info: { size: number; contentType: string }
  ) {
    this.#metadata[cachePath] = {
      size: info.size,
      contentType: info.contentType,
    };
    this.#writeMetadata();
  }

  #writeMetadata() {
    const metadataPath = path.join(this.#cacheFolder, "metadata.json");
    fs.writeFileSync(metadataPath, JSON.stringify(this.#metadata, null, 2));
  }
}
