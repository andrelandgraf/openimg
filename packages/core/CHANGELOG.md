# Changelog

# 1.1.0

## openimg/react

- Add optional `params` prop to `Image`/`Img` component to pass custom optimization parameters to the optimizer endpoint. This enables custom sharp transformations by adding arbitrary query parameters to the image URL.

# 1.0.0

- Switch from `optionalDependencies` to `peerDependencies` for sharp
- Fix image orientation based on EXIF orientation.

Note: In case you're experiencing image orientation issues, clear the openimg file cache to ensure source images are re-optimized with correct orientation.

- Support passing in custom sharp pipelines via `getSharpPipeline`

# 0.7.0

- Remove `openimg-node`, `openimg-bun`, and `openimg-react` duplicate packages.

## openimg/node & openimg/bun

- Add support for `getImgSource` to return `type` `"data"` with a `data` property that contains the image data as a buffer or stream.
- `getImgPlaceholder` now supports passing in a `ReadableStream`.
- `getImgMetadata` now supports passing in a `ReadableStream`.

# 0.6.0

## openimg/node & openimg/bun

- `getImgResponse` now always returns the correct `Content-Type` header and will also set `Content-Length`.
- Introduces `metadata.json` file to the cache (if cache is enabled) to track file sizes and content-types. This will reset your cache and refetch all images.

Note that v0.6.0 will force you to refetch all images. No action is required. Existing files in the cache will be overwritten.

# 0.5.1

## openimg/react

- Fix remove `background` styles once image is loaded.

# 0.5.0

## openimg/node & openimg/bun

- `src` removed from `ImgParams`. `GetImgSource` is now responsible for parsing the `src` string from the request.
- Use `ImgSource` instead of raw `src` for cache folder path.

# 0.4.1

## openimg/node & openimg/bun

- Use `image/jpeg` as fallback content-type in `getImgResponse` if format not specified.

# 0.3.0

## openimg/node & openimg/bun

- `getImgParams` can now be async and return a promise.

# 0.2.2

## openimg/react

- Expose `defaultGetSrc` function.
- Expose `GetSrc` and `GetSrcArgs` types.

# 0.2.1

## openimg/node & openimg/bun

- Change `headers` type in `getImgSource` from `Headers` to `HeadersInit`.
- Change `headers` type in `getImgResponse` from `Headers` to `HeadersInit`.

# 0.2.0

## openimg/node & openimg/bun

- `getImgSource` can now be async and return a promise.
- `getImgSource` return value of type "fetch" can now include a `headers` property that will be passed to the fetch request.

# 0.1.0

- Initial feature-complete release of the package.
