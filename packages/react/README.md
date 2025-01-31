# openimg-react

openimg-react (Open Image React) provides an Image component (aliased as Img) for querying optimized images from an image optimization endpoint (e.g., openimg-node). The component uses standard HTML img element attributes to generate a picture element with sources for avif and webp images in different sizes.

## Installation

```bash
npm i openimg-react
```

## Usage

```tsx
import { Img } from "openimg-react";

export default function App() {
  return (
    <Img src="/cat.png" width={800} height={600} fit="cover" alt="A cute cat" />
  );
}
```

Under the hood, `Img` will render an HTML picture element and render:

```html
<picture>
  <source
    srcset="/img?src=/cat.png&w=300&h=300&format=avif"
    media="(min-width: 300px)"
    type="image/avif"
  />
  <source
    srcset="/img?src=/cat.png&w=225&h=225&format=avif"
    media="(min-width: 225px)"
    type="image/avif"
  />
  <source
    srcset="/img?src=/cat.png&w=200&h=200&format=avif"
    media="(min-width: 200px)"
    type="image/avif"
  />
  <source
    srcset="/img?src=/cat.png&w=300&h=300&format=webp"
    media="(min-width: 300px)"
    type="image/webp"
  />
  <source
    srcset="/img?src=/cat.png&w=225&h=225&format=webp"
    media="(min-width: 225px)"
    type="image/webp"
  />
  <source
    srcset="/img?src=/cat.png&w=200&h=200&format=webp"
    media="(min-width: 200px)"
    type="image/webp"
  />
  <img
    width="300"
    height="300"
    alt="A small cat"
    src="/img?src=/cat.png&w=300&h=300"
  />
</picture>
```

## Configuration

You can configure the output of the Img component with the `OpenImgContextProvider`. This allows you to set:

- Breakpoints for responsive images.
- Image optimizer URL (`optimizerSrc`).
- Target formats (avif, webp, etc.).
- Custom logic for generating image URLs.

```tsx
import { OpenImgContextProvider, Img } from "openimg-react";

export default function App() {
  return (
    <OpenImgContextProvider optimizerSrc="https://my-optimizer.com">
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

### Provider Props

- `getBreakpoints`:Function to define custom breakpoints for responsive sources. Array of [width, height] tuples. Should start at the img's height/width and go down.
- `getSrc`: Function to create a custom src string for the source and img elements.
- `targetFormats`: An array of supported optimized formats: ["avif"] | ["avif", "webp"] | ["webp"].
- `optimizerSrc`: The image optimization endpoint (path or URL). Defaults to "/img".

#### getBreakpoints

Default looks like this:

```ts
function getBreakpoints(width, height) {
  const breakpoints: [number, number][] = [];
  let currentWidth = width;
  let currentHeight = height;
  while (currentWidth > 200 && currentHeight > 200) {
    breakpoints.push([currentWidth, currentHeight]);
    currentWidth = Math.floor(currentWidth * 0.75);
    currentHeight = Math.floor(currentHeight * 0.75);
  }
  breakpoints.push([200, 200]);
  return breakpoints;
}
```

#### getSrc

Default looks like this:

```ts
function getSrc({ src, width, height, fit, format, optimizerSrc }) {
  const params = new URLSearchParams({
    src,
    w: width.toString(),
    h: height.toString(),
  });
  if (fit) params.append("fit", fit);
  if (format) params.append("format", format);
  return optimizerSrc + "?" + params.toString();
}
```
