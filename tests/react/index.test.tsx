import React from "react";
import { test, expect } from "bun:test";
import { screen, render } from "@testing-library/react";
import { Img, OpenImgContextProvider } from "openimg-react";
import { TargetFormat } from "../../packages/react/dist/types/react";

test("renders without errors when required props are provided", () => {
  render(<Img src="/cat.png" width={800} height={800} alt="A cute cat" />);
  const imgElement = screen.getByAltText("A cute cat");
  expect(imgElement).toBeInTheDocument();
});

test("applies additional attributes to the <img> tag", () => {
  render(
    <Img
      src="/cat.png"
      width={800}
      height={800}
      alt="A cute cat"
      className="test-class"
      data-testid="test-image"
    />
  );
  const imgElement = screen.getByTestId("test-image");
  expect(imgElement).toHaveClass("test-class");
});

test("applies default attributes for better web performance", () => {
  render(
    <Img
      src="/cat.png"
      width={800}
      height={800}
      alt="A cute cat"
      data-testid="test-image"
    />
  );
  const imgElement = screen.getByTestId("test-image");
  expect(imgElement).toHaveAttribute("loading", "lazy");
  expect(imgElement).toHaveAttribute("decoding", "async");
  expect(imgElement).toHaveAttribute("fetchpriority", "low");
});

test("applies priority attributes if isAboveFold specified", () => {
  render(
    <Img
      src="/cat.png"
      isAboveFold
      width={800}
      height={800}
      alt="A cute cat"
      data-testid="test-image"
    />
  );
  const imgElement = screen.getByTestId("test-image");
  expect(imgElement).toHaveAttribute("loading", "eager");
  expect(imgElement).toHaveAttribute("decoding", "auto");
  expect(imgElement).toHaveAttribute("fetchpriority", "high");
});

test("applies role presentation if not alt text supplied", () => {
  render(
    <Img src="/cat.png" width={800} height={800} data-testid="test-image" />
  );
  const imgElement = screen.getByTestId("test-image");
  expect(imgElement).toHaveAttribute("role", "presentation");
});

test("generates <source> elements for each format", () => {
  const { container } = render(
    <Img src="/cat.png" width={800} height={800} alt="A cute cat" />
  );
  const sourceElements = container.querySelectorAll("source");
  expect(sourceElements.length).toEqual(2);
});

test("generates only specified <source> element when custom formats are provided", () => {
  const customFormats = ["webp"] satisfies TargetFormat[]; // Only use "webp" format
  const { container } = render(
    <OpenImgContextProvider targetFormats={customFormats}>
      <Img src="/cat.png" width={800} height={800} alt="A cute cat" />
    </OpenImgContextProvider>
  );

  const sourceElements = container.querySelectorAll("source");

  expect(sourceElements.length).toEqual(1);

  // Verify that only "webp" source exists
  expect(sourceElements[0]).toHaveAttribute("type", "image/webp");
});

test("sizes, srcset and src strings for /cat.png with 1200w 1200h", () => {
  const { container } = render(
    <Img src="/cat.png" width={1200} height={1200} alt="A small cat" />
  );

  const expectedSrcSets = [640, 768, 1024, 1200];
  const sizesStr = `(max-width: ${expectedSrcSets[0]}px) ${expectedSrcSets[0]}px, (max-width: ${expectedSrcSets[1]}px) ${expectedSrcSets[1]}px, (max-width: ${expectedSrcSets[2]}px) ${expectedSrcSets[2]}px, 1200px`;

  const sourceElements = container.querySelectorAll("source");
  const imgElement = container.querySelector("img");

  // Verify src, srcset and sizes for each source element
  const formats = ["avif", "webp"];

  formats.forEach((format, i) => {
    const source = sourceElements[i];
    expect(source.getAttribute("sizes")).toBe(sizesStr);
    expectedSrcSets.forEach((widthHeight) => {
      const expectedSrcset = `/img?src=${encodeURIComponent(
        "/cat.png"
      )}&w=${widthHeight}&h=${widthHeight}&format=${format}`;
      expect(source.getAttribute("srcset")).toInclude(expectedSrcset);
    });
  });

  // Verify the fallback img tag src, srcset and sizes
  const expectedImgSrc = `/img?src=${encodeURIComponent(
    "/cat.png"
  )}&w=1200&h=1200`;
  expect(imgElement?.getAttribute("src")).toBe(expectedImgSrc);
  expect(imgElement?.getAttribute("sizes")).toBe(sizesStr);
  expectedSrcSets.forEach((widthHeight) => {
    const expectedSrcset = `/img?src=${encodeURIComponent(
      "/cat.png"
    )}&w=${widthHeight}&h=${widthHeight}`;
    expect(imgElement?.getAttribute("srcset")).toInclude(expectedSrcset);
  });
});

test("sizes, srcset and src strings for /cat.png with 80w 80h", () => {
  const { container } = render(
    <Img src="/cat.png" width={80} height={80} alt="A small cat" />
  );

  const sourceElements = container.querySelectorAll("source");
  const imgElement = container.querySelector("img");

  // Verify src, srcset and sizes for each source element
  const formats = ["avif", "webp"];

  formats.forEach((format, i) => {
    const source = sourceElements[i];
    expect(source.getAttribute("sizes")).toBe("80px");
    expect(source.getAttribute("srcset")).toBe(
      `/img?src=${encodeURIComponent("/cat.png")}&w=80&h=80&format=${format}`
    );
  });

  // Verify the fallback img tag src, srcset and sizes
  const expectedImgSrc = `/img?src=${encodeURIComponent("/cat.png")}&w=80&h=80`;
  expect(imgElement?.getAttribute("src")).toBe(expectedImgSrc);
  expect(imgElement?.getAttribute("sizes")).toBe(null);
  expect(imgElement?.getAttribute("srcset")).toBe(null);
});

test("sizes, srcset and src strings for /cat.png with 800w 400h and optimizerEndpoint https://standalone.com/optimize", () => {
  const { container } = render(
    <OpenImgContextProvider optimizerEndpoint="https://standalone.com/optimize">
      <Img src="/cat.png" width={800} height={400} alt="A cute cat" />
    </OpenImgContextProvider>
  );

  const expectedBreakpoints = [640, 768, 800];
  const expectedSizes = `(max-width: ${expectedBreakpoints[0]}px) ${expectedBreakpoints[0]}px, (max-width: ${expectedBreakpoints[1]}px) ${expectedBreakpoints[1]}px, 800px`;

  const sourceElements = container.querySelectorAll("source");
  const imgElement = container.querySelector("img");

  // Verify srcset for each source element
  const formats = ["avif", "webp"];

  formats.forEach((format, i) => {
    const source = sourceElements[i];
    expect(source.getAttribute("sizes")).toBe(expectedSizes);
    expectedBreakpoints.forEach((w) => {
      const expectedSrcset = `https://standalone.com/optimize?src=${encodeURIComponent(
        "/cat.png"
      )}&w=${w}&h=${w / 2}&format=${format}`;
      expect(source.getAttribute("srcset")).toInclude(expectedSrcset);
    });
  });

  // Verify the fallback img tag src
  const expectedImgSrc = `https://standalone.com/optimize?src=${encodeURIComponent(
    "/cat.png"
  )}&w=800&h=400`;
  expect(imgElement?.getAttribute("src")).toBe(expectedImgSrc);
  expect(imgElement?.getAttribute("sizes")).toBe(expectedSizes);
  expectedBreakpoints.forEach((w) => {
    const expectedSrcset = `https://standalone.com/optimize?src=${encodeURIComponent(
      "/cat.png"
    )}&w=${w}&h=${w / 2}`;
    expect(imgElement?.getAttribute("srcset")).toInclude(expectedSrcset);
  });
});
