# openimg/react

openimg-react (Open Image React) provides an `Image` component (aliased as `Img`) for querying optimized images from an image optimization endpoint (e.g., openimg/node) and a context provider `OpenImgContextProvider` for global configuration options. The `Image` component renders an HTML picture element utilizing modern HTML attributes and best practices.

## Features

- `Image`/`Img` component to query for optimized images
  - Queries for optimal resized images based on breakpoints and viewport size
  - Queries for webp and avif formats (configurable)
  - Supports origin and remote images
  - Supports placeholders to display until the full image loads
  - Easy prioritization of images above the fold
- `OpenImgContextProvider` to configure the Img component

## Installation

The code is available via `openimg/react` and `openimg-react`. For most use cases, you probably want to install `openimg`:

```bash
npm i sharp openimg
```

Note, `sharp` is only needed if you want to use the server-side functionality.

If you only want to use the React utilities, you can also install `openimg-react` independently:

```bash
npm i openimg-react
```

## API

Import the `Img`/`Image` component from `openimg/react`:

```tsx
import { Img } from "openimg/react";

export default function App() {
  return (
    <Img src="/cat.png" width={800} height={600} fit="cover" alt="A cute cat" />
  );
}
```

Under the hood, `Img` will render an HTML picture element with source elements for webp and avif and different sizes and srcset attributes to query for the smallest image and optimal format given the viewport width and browser capabilities. It will further set the `loading`, `decoding`, and `fetchpriority` attributes. The image can be prioritized by setting `isAboveFold` to true.

### Img Props

You can pass in all standard HTML img element attributes to the Img component. They will override the defaults set by the `Img` component. Further, the following props are available:

- width (required): the intrinsic width of the image in pixels; used to calculate the aspect ratio. Provide alternate width and height to change the aspect ratio.
- height (required): the intrinsic height of the image in pixels; used to calculate the aspect ratio. Provide alternate width and height to change the aspect ratio.
- fit (optional): how the image should be resized to fit the aspect ratio (if different from intrinsic ratio): "cover" or "contain".
- isAboveFold (defaults to `false`): whether the image is above the fold or not, affects what default optimization settings are used.
- placeholder (optional): base64 encoded string of a low quality image to use as a placeholder until the full image loads.

Note, if not `alt` is provided, the Img component will set the role to "presentation".

### OpenImgContextProvider

You can configure the output of the `Img` component with the `OpenImgContextProvider`. This allows you to set:

- Breakpoints for responsive images.
- Image optimizer URL (`optimizerEndpoint`).
- Target formats (avif, webp).
- Custom logic for generating image URLs.

```tsx
import { OpenImgContextProvider, Img } from "openimg/react";

export default function App() {
  return (
    <OpenImgContextProvider optimizerEndpoint="https://my-optimizer.com">
      <Img
        src="https://example.com/image.jpg"
        width={1200}
        height={800}
        fit="contain"
        alt="Example Image"
      />
    </OpenImgContextProvider>
  );
}
```

#### OpenImgContextProvider Props

- `breakpoints`: width[] breakpoints for the picture's "sizes" attribute. Must be in ascending order. Defaults to Tailwind's breakpoints (sm, md, lg, xl, 2xl): [640, 768, 1024, 1280, 1536].
- `getSrc`: fn to return custom src string given the src, width, height, fit, format, and optimizerEndpoint. Defaults to function returning `{optimizerEndpoint}?src={src}&w={width}&h={height}&fit={fit}&format={format}`.
- `targetFormats`: string[] formats that are supported. Defaults to ["avif", "webp"] (original image format is always included and doesn't need to be specified).
- `optimizerEndpoint`: The path ("/path/to/optimizer") or URL ("https://my-optimizer.com") to the image optimizer endpoint. Defaults to "/img".

**getSrc:**

Default looks like this:

```ts
function getSrc({ src, width, height, fit, format, optimizerEndpoint }) {
  const params = new URLSearchParams({
    src,
    w: width.toString(),
    h: height.toString(),
  });
  if (fit) params.append("fit", fit);
  if (format) params.append("format", format);
  return optimizerEndpoint + "?" + params.toString();
}
```
