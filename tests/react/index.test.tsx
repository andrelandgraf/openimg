import React from "react";
import { test, expect } from "bun:test";
import { screen, render } from "@testing-library/react";
import { Img, OpenImgContextProvider, Format } from "openimg-react";

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
    />,
  );
  const imgElement = screen.getByTestId("test-image");
  expect(imgElement).toHaveClass("test-class");
});

test("generates <source> elements for each format", () => {
  const { container } = render(
    <Img src="/cat.png" width={800} height={800} alt="A cute cat" />,
  );
  const sourceElements = container.querySelectorAll("source");
  expect(sourceElements.length).toEqual(2);
});

test("generates only specified <source> element when custom formats are provided", () => {
  const customFormats = ["webp"] satisfies Format[]; // Only use "webp" format
  const { container } = render(
    <OpenImgContextProvider targetFormats={customFormats}>
      <Img src="/cat.png" width={800} height={800} alt="A cute cat" />
    </OpenImgContextProvider>,
  );

  const sourceElements = container.querySelectorAll("source");

  expect(sourceElements.length).toEqual(1);

  // Verify that only "webp" source exists
  expect(sourceElements[0]).toHaveAttribute("type", "image/webp");
});

test("verifies srcset strings and img src for /cat.png with 300w 300h", () => {
  const { container } = render(
    <Img src="/cat.png" width={300} height={300} alt="A small cat" />,
  );

  const expectedBreakpoints = [
    { width: 300, height: 300 },
    { width: 100, height: 100 },
  ];

  const sourceElements = container.querySelectorAll("source");
  const imgElement = container.querySelector("img");

  // Verify srcset for each source element
  const formats = ["avif", "webp"];

  formats.forEach((format, i) => {
    expectedBreakpoints.forEach(({ width, height }) => {
      const source = sourceElements[i];
      const expectedSrcset = `/img?src=${encodeURIComponent("/cat.png")}&w=${width}&h=${height}&format=${format}`;
      expect(source.getAttribute("srcset")).toInclude(expectedSrcset);
    });
  });

  // Verify the fallback img tag src
  const expectedImgSrc = `/img?src=${encodeURIComponent("/cat.png")}&w=300&h=300`;
  expect(imgElement?.getAttribute("src")).toBe(expectedImgSrc);
});

test("verifies srcset strings and img src for /cat.png with 300w 300h and optimizerSrc https://standalone.com/optimize", () => {
  const { container } = render(
    <OpenImgContextProvider optimizerEndpoint="https://standalone.com/optimize">
      <Img src="/cat.png" width={800} height={800} alt="A cute cat" />
    </OpenImgContextProvider>,
  );

  const expectedBreakpoints = [
    { width: 800, height: 800 },
    { width: 600, height: 600 },
    { width: 400, height: 400 },
    { width: 200, height: 200 },
    { width: 100, height: 100 },
  ];

  const sourceElements = container.querySelectorAll("source");
  const imgElement = container.querySelector("img");

  // Verify srcset for each source element
  const formats = ["avif", "webp"];

  formats.forEach((format, i) => {
    expectedBreakpoints.forEach(({ width, height }) => {
      const source = sourceElements[i];
      const expectedSrcset = `https://standalone.com/optimize?src=${encodeURIComponent("/cat.png")}&w=${width}&h=${height}&format=${format}`;
      expect(source.getAttribute("srcset")).toInclude(expectedSrcset);
    });
  });

  // Verify the fallback img tag src
  const expectedImgSrc = `https://standalone.com/optimize?src=${encodeURIComponent("/cat.png")}&w=800&h=800`;
  expect(imgElement?.getAttribute("src")).toBe(expectedImgSrc);
});
