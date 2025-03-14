# openimg/react

openimg/react (Open Image React) provides an `Image` component (aliased as `Img`) for querying optimized images from an image optimization endpoint (e.g., openimg/node or openimg/bun) and a context provider `OpenImgContextProvider` for global configuration options. The `Image` component renders an HTML picture element utilizing modern HTML attributes and best practices.

## Features

- `Image`/`Img` component to query for optimized images
  - Queries for optimal resized images based on breakpoints and viewport size
  - Queries for webp and avif formats (configurable)
  - Supports origin and remote images
  - Supports placeholders to display until the full image loads
  - Easy prioritization of images above the fold
- `OpenImgContextProvider` to configure the Img component

## Installation

The code is available via `openimg/react`:

```bash
npm i sharp openimg
```

Note, `sharp` is only needed if you want to use the server-side functionality.

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

#### placeholder: string | undefined

The placeholder prop is optional, but a great way to improve the user experience. It allows you to provide a low-quality image that will be displayed while the full image is loading. Make sure to pass the `Image` component the placeholder image as soon as possible. For instance, during server-side rendering or the initial render of the image component. This ensures that the placeholder is displayed immediately. You can use the `getImgPlaceholder` function from `openimg/node` or `openimg/bun` to generate the placeholder.

Transparent images and no JavaScript: This package utilizes the CSS `background-image` property to display the placeholder. Once the image is fully loaded, client-side JavaScript is used to remove the `background-image` styling. Note that if JS is disabled and a transparent image (e.g., PNG with transparency) is loaded with a placeholder, the placeholder will still be visible in the back. In this case, it may be better to avoid using placeholders.

### Alt text

Alt text is important for accessibility and SEO. It is recommended to always provide alt text for images. If no `alt` text is provided, the Img component will instead set the role attribute to "presentation". This ensures that the image is ignored by screen readers and search engines.

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

#### getSrc

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
