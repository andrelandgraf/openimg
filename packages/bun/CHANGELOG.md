# Changelog

# 0.6.0

- `getImgResponse` now always returns the correct `Content-Type` header and will also set `Content-Length`.

# 0.5.0

- `src` removed from `ImgParams`. `GetImgSource` is now responsible for parsing the `src` string from the request.
- Use `ImgSource` instead of raw `src` for cache folder path.

# 0.4.1

- Use `image/jpeg` as fallback content-type in `getImgResponse` if format not specified.

# 0.3.0

- `getImgParams` can now be async and return a promise.

# 0.2.1

- Change `headers` type in `getImgSource` from `Headers` to `HeadersInit`.
- Change `headers` type in `getImgResponse` from `Headers` to `HeadersInit`.

# 0.2.0

- `getImgSource` can now be async and return a promise.
- `getImgSource` return value of type "fetch" can now include a `headers` property that will be passed to the fetch request.

# 0.1.0

- Initial feature-complete release of the package.
