import React, { createContext, useContext, useEffect, useRef } from "react";

export type Fit = "cover" | "contain";
export type TargetFormat = "webp" | "avif";

/**
 * - src: the src prop passed to the Image component
 * - width: the width prop passed to the Image component
 * - height: the height prop passed to the Image component
 * - fit: the fit prop passed to the Image component
 * - format: the format prop passed to the Image component
 * - optimizerEndpoint: the OpenImgContext optimizerEndpoint value
 * - params: additional parameters to add to the img src URL, for instance 'black-white=true' or 'blur=10' to be used for custom optimizations
 */
export type GetSrcArgs = {
  src: string;
  width: number;
  height: number;
  fit?: Fit;
  format?: TargetFormat;
  params?: Record<string, string>;
  optimizerEndpoint: string;
};

/**
 * Function to return a custom src string given the src, width, height, fit, format, and optimizerEndpoint
 */
export type GetSrc = (args: GetSrcArgs) => string;

/**
 * - breakpoints: width[] breakpoints for the picture's "sizes" attribute. Must be in ascending order.
 *   Defaults to Tailwind's breakpoints (sm, md, lg, xl, 2xl): [640, 768, 1024, 1280, 1536]
 * - getSrc: Function to return a custom src string given the src, width, height, fit, format, and optimizerEndpoint
 *   Defaults to function returning `{optimizerEndpoint}?src={src}&w={width}&h={height}&fit={fit}&format={format}`
 * - targetFormats: string[] formats that are supported
 *   Defaults to ["avif", "webp"] (original image format is always included and doesn't need to be specified)
 * - optimizerEndpoint: The path ("/path/to/optimizer") or URL ("https://my-optimizer.com") to the image optimizer endpoint
 *   Defaults to "/img"
 * - __react18FetchPriority: boolean to use React 18's fetchpriority prop on the img element instead of React 19's FetchPriority
 */
type OpenImgContextProps = {
  breakpoints: number[];
  getSrc: GetSrc;
  targetFormats: TargetFormat[];
  optimizerEndpoint: string;
};

/**
 * @param {GetSrcArgs} args
 * @returns {string} The src string for the picture element's img and sources
 * @description The default getSrc function for the OpenImgContext
 * It takes an img src, width, height, fit, format, and optimizerEndpoint
 * and returns: `${optimizerEndpoint}?src=${src}&w=${width}&h=${height}&fit=${fit}&format=${format}`
 */
export const defaultGetSrc: GetSrc = ({
  src,
  width,
  height,
  fit,
  format,
  params,
  optimizerEndpoint,
}) => {
  const searchParams = new URLSearchParams({
    src,
    w: width.toString(),
    h: height.toString(),
  });
  if (fit) searchParams.set("fit", fit);
  if (format) searchParams.set("format", format);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      searchParams.set(key, value);
    });
  }
  return optimizerEndpoint + "?" + searchParams.toString();
};

const defaultContext: OpenImgContextProps = {
  breakpoints: [640, 768, 1024, 1280, 1536],
  getSrc: defaultGetSrc,
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
  params?: Record<string, string>;
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
 * @param {Record<string, string>} [props.params] - Additional parameters to add to the img src URL, for instance 'black-white=true' or 'blur=10' to be used for custom optimizations
 */
export function Image({
  src,
  width,
  height,
  fit,
  isAboveFold,
  placeholder,
  params,
  ...imgProps
}: ImageProps) {
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element || !placeholder) {
      return;
    }
    function clearStyles(element: HTMLImageElement) {
      element.style.backgroundImage = "";
      element.style.backgroundSize = "";
      element.style.backgroundRepeat = "";
    }
    if (element.complete) {
      clearStyles(element);
    }
    element.addEventListener("load", () => {
      clearStyles(element);
    });
  }, [placeholder]);

  if (!src || !width || !height) {
    console.error(
      "openimg: The `src`, `width`, and `height` props are required for the Image/Img component."
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
  // Unfortunately, React 19 complains about fetchpriority being lowercase
  // https://github.com/pinterest/gestalt/pull/3976 but hopefully it will be fixed
  const fetchPriorityKey = React.version.startsWith("18")
    ? "fetchpriority"
    : "fetchPriority";
  const fetchPriorityProp = {
    [fetchPriorityKey]: isAboveFold ? "high" : "low",
  };

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
                        params,
                        optimizerEndpoint,
                      }) + ` ${w}w`
                  )
                  .join(", ")
              : getSrc({
                  src,
                  width: widthNum,
                  height: heightNum,
                  fit,
                  format,
                  params,
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
        ref={ref}
        width={width}
        height={height}
        role={imgProps.alt ? undefined : "presentation"}
        loading={isAboveFold ? "eager" : "lazy"}
        decoding={isAboveFold ? "auto" : "async"}
        {...fetchPriorityProp}
        src={getSrc({
          src,
          width: widthNum,
          height: heightNum,
          fit,
          params,
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
                      params,
                      optimizerEndpoint,
                    }) + ` ${w}w`
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
        style={{
          backgroundImage: placeholder ? `url(${placeholder})` : undefined,
          backgroundSize: placeholder ? "cover" : undefined,
          backgroundRepeat: "no-repeat",
          ...imgProps.style,
        }}
      />
    </picture>
  );
}

export { Image as Img };
export type { ImageProps as ImgProps };
