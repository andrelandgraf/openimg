import React, { createContext, useContext } from "react";

export type Fit = "cover" | "contain";
export type TargetFormat = "webp" | "avif";

/**
 * - breakpoints: width[] breakpoints for the picture's "sizes" attribute. Must be in ascending order.
 *   Defaults to Tailwind's breakpoints (sm, md, lg, xl, 2xl): [640, 768, 1024, 1280, 1536]
 * - getSrc: fn to return custom src string given the src, width, height, fit, format, and optimizerEndpoint
 *   Defaults to function returning `{optimizerEndpoint}?src={src}&w={width}&h={height}&fit={fit}&format={format}`
 * - targetFormats: string[] formats that are supported
 *   Defaults to ["avif", "webp"] (original image format is always included and doesn't need to be specified)
 * - optimizerEndpoint: The path ("/path/to/optimizer") or URL ("https://my-optimizer.com") to the image optimizer endpoint
 *   Defaults to "/img"
 */
type OpenImgContextProps = {
  breakpoints: number[];
  getSrc: (args: {
    src: string;
    width: number;
    height: number;
    fit?: Fit;
    format?: TargetFormat;
    optimizerEndpoint: string;
  }) => string;
  targetFormats: TargetFormat[];
  optimizerEndpoint: string;
};

const defaultContext: OpenImgContextProps = {
  breakpoints: [640, 768, 1024, 1280, 1536],
  getSrc: ({ src, width, height, fit, format, optimizerEndpoint }) => {
    const params = new URLSearchParams({
      src,
      w: width.toString(),
      h: height.toString(),
    });
    if (fit) params.append("fit", fit);
    if (format) params.append("format", format);
    return optimizerEndpoint + "?" + params.toString();
  },
  targetFormats: ["avif", "webp"],
  optimizerEndpoint: "/img",
};

/**
 * - breakpoints: width[] breakpoints for the picture's "sizes" attribute. Must be in ascending order.
 *   Defaults to Tailwind's breakpoints (sm, md, lg, xl, 2xl): [640, 768, 1024, 1280, 1536]
 * - getSrc: fn to return custom src string given the src, width, height, fit, format, and optimizerEndpoint
 *   Defaults to function returning `{optimizerEndpoint}?src={src}&w={width}&h={height}&fit={fit}&format={format}`
 * - targetFormats: string[] formats that are supported
 *   Defaults to ["avif", "webp"] (original image format is always included and doesn't need to be specified)
 * - optimizerEndpoint: The path ("/path/to/optimizer") or URL ("https://my-optimizer.com") to the image optimizer endpoint
 *   Defaults to "/img"
 */
export type OpenImgContextProviderProps = {
  breakpoints?: OpenImgContextProps["breakpoints"];
  getSrc?: OpenImgContextProps["getSrc"];
  targetFormats?: OpenImgContextProps["targetFormats"];
  optimizerEndpoint?: OpenImgContextProps["optimizerEndpoint"];
  children: React.ReactNode;
};

const OpenImgContext = createContext<OpenImgContextProps>(defaultContext);

/**
 * OpenImgContextProvider component
 * @param {OpenImgContextProviderProps} props - The props for the provider
 * @param {string[]} props.breakpoints - width[] breakpoints for the picture's "sizes" attribute. Must be in ascending order.
 *   Defaults to Tailwind's breakpoints (sm, md, lg, xl, 2xl): [640, 768, 1024, 1280, 1536]
 * @param {() => string} props.getSrc - fn to return custom src string given the src, width, height, fit, format, and optimizerEndpoint
 *   Defaults to function returning `{optimizerEndpoint}?src={src}&w={width}&h={height}&fit={fit}&format={format}`
 * @param {string[]} props.targetFormats - formats that are supported
 *   Defaults to ["avif", "webp"] (original image format is always included and doesn't need to be specified)
 * @param {string} props.optimizerEndpoint - The path ("/path/to/optimizer") or URL ("https://my-optimizer.com") to the image optimizer endpoint
 *   Defaults to "/img"
 */
export function OpenImgContextProvider({
  breakpoints,
  getSrc,
  targetFormats,
  optimizerEndpoint,
  children,
}: OpenImgContextProviderProps) {
  const contextValue = {
    breakpoints: breakpoints || defaultContext.breakpoints,
    getSrc: getSrc || defaultContext.getSrc,
    targetFormats: targetFormats || defaultContext.targetFormats,
    optimizerEndpoint: optimizerEndpoint || defaultContext.optimizerEndpoint,
  };

  return (
    <OpenImgContext.Provider value={contextValue}>
      {children}
    </OpenImgContext.Provider>
  );
}

/**
 * - width: the intrinsic width of the image in pixels; used to calculate the aspect ratio. Provide alternate width and height to change the aspect ratio.
 * - height: the intrinsic height of the image in pixels; used to calculate the aspect ratio. Provide alternate width and height to change the aspect ratio.
 * - fit: how the image should be resized to fit the aspect ratio (if different from intrinsic ratio): "cover" or "contain"
 * - isAboveFold: whether the image is above the fold or not, affects what default optimization settings are used
 * - placeholder: base64 encoded string of a low quality image to use as a placeholder until the full image loads
 */
export type ImageProps = Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  "width" | "height"
> & {
  width: number | string;
  height: number | string;
  fit?: Fit;
  isAboveFold?: boolean;
  placeholder?: string;
};

/**
 * Image component
 * @param {ImageProps} props - The props for the image, including HTMLImageElement attributes
 * @param {string} props.src - The URL of the image to display
 * @param {number|string} props.width - The intrinsic width of the image in pixels; used to calculate the aspect ratio. Provide alternate width and height to change the aspect ratio.
 * @param {number|string} props.height - The intrinsic height of the image in pixels; used to calculate the aspect ratio. Provide alternate width and height to change the aspect ratio.
 * @param {Fit} [props.fit] - How the image should be resized to fit the aspect ratio (if different from intrinsic ratio): "cover" or "contain"
 * @param {boolean} [props.isAboveFold] - Whether the image is above the fold or not, affects what default optimization settings are used
 * @param {string} [props.placeholder] - Base64 encoded string of a low quality image to use as a placeholder until the full image loads
 */
export function Image({
  src,
  width,
  height,
  fit,
  isAboveFold,
  placeholder,
  ...imgProps
}: ImageProps) {
  if (!src || !width || !height) {
    console.error(
      "The `src`, `width`, and `height` props are required for the Image component.",
    );
    return null;
  }
  let widthNum = typeof width === "string" ? parseInt(width) : width;
  let heightNum = typeof height === "string" ? parseInt(height) : height;
  const ratio = widthNum / heightNum;

  const { breakpoints, getSrc, targetFormats, optimizerEndpoint } =
    useContext(OpenImgContext);
  const filteredBreakpoints = breakpoints.filter((bp) => bp <= widthNum);

  // Note fetchPriority is not supported in React 18, only in React 19
  // So it's lowercased here to avoid React warnings in React 18
  return (
    <picture>
      {targetFormats.map((format) => (
        <source
          key={format}
          width={width}
          height={height}
          srcSet={
            filteredBreakpoints.length
              ? [...filteredBreakpoints, widthNum]
                  .map(
                    (w) =>
                      getSrc({
                        src,
                        width: w,
                        height: w / ratio,
                        fit,
                        format,
                        optimizerEndpoint,
                      }) + ` ${w}w`,
                  )
                  .join(", ")
              : getSrc({
                  src,
                  width: widthNum,
                  height: heightNum,
                  fit,
                  format,
                  optimizerEndpoint,
                })
          }
          sizes={
            filteredBreakpoints.length
              ? filteredBreakpoints
                  .map((w) => `(max-width: ${w}px) ${w}px`)
                  .join(", ") + `, ${widthNum}px`
              : `${widthNum}px`
          }
          type={`image/${format}`}
        />
      ))}
      <img
        width={width}
        height={height}
        role={imgProps.alt ? undefined : "presentation"}
        loading={isAboveFold ? "eager" : "lazy"}
        decoding={isAboveFold ? "auto" : "async"}
        fetchpriority={isAboveFold ? "high" : "low"}
        style={{
          backgroundImage: placeholder ? `url(${placeholder})` : undefined,
          backgroundSize: placeholder ? "cover" : undefined,
        }}
        ref={(element) => {
          if (element?.complete && placeholder) {
            element.style.backgroundImage = "";
            element.style.backgroundSize = "";
          }
        }}
        src={getSrc({
          src,
          width: widthNum,
          height: heightNum,
          fit,
          optimizerEndpoint,
        })}
        srcSet={
          filteredBreakpoints.length
            ? [...filteredBreakpoints, widthNum]
                .map(
                  (w) =>
                    getSrc({
                      src,
                      width: w,
                      height: w / ratio,
                      fit,
                      optimizerEndpoint,
                    }) + ` ${w}w`,
                )
                .join(", ")
            : undefined
        }
        sizes={
          filteredBreakpoints.length
            ? filteredBreakpoints
                .map((w) => `(max-width: ${w}px) ${w}px`)
                .join(", ") + `, ${widthNum}px`
            : undefined
        }
        {...imgProps}
      />
    </picture>
  );
}

export { Image as Img };
export type { ImageProps as ImgProps };
