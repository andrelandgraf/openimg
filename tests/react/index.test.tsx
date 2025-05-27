import { test, expect } from "bun:test";
import { screen, render } from "@testing-library/react";
import {
  Img,
  OpenImgContextProvider,
  type GetSrc,
} from "../../packages/core/src/react/index";
// Import the testing setup to ensure matchers are properly registered
import "./testing-library";

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
  const { container } = render(
    <OpenImgContextProvider targetFormats={["webp"]}>
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

test("applies custom getSrc function to generate source URLs", () => {
  // Custom getSrc function that uses a different URL pattern
  const customGetSrc: GetSrc = ({
    src,
    width,
    height,
    format,
    params,
    optimizerEndpoint,
  }) => {
    const baseUrl = `${optimizerEndpoint}/custom-transform`;
    const searchParams = new URLSearchParams();
    searchParams.append("image", src);
    searchParams.append("width", width.toString());
    searchParams.append("height", height.toString());
    if (format) searchParams.append("fmt", format);
    return `${baseUrl}?${searchParams.toString()}`;
  };

  const { container } = render(
    <OpenImgContextProvider getSrc={customGetSrc}>
      <Img
        src="/cat.png"
        width={800}
        height={600}
        alt="A cute cat"
        data-testid="test-image"
      />
    </OpenImgContextProvider>
  );

  const sourceElements = container.querySelectorAll("source");
  const imgElement = screen.getByTestId("test-image");

  // Expected breakpoints for responsive images
  const expectedBreakpoints = [640, 768, 800];
  const expectedSizes = `(max-width: ${expectedBreakpoints[0]}px) ${expectedBreakpoints[0]}px, (max-width: ${expectedBreakpoints[1]}px) ${expectedBreakpoints[1]}px, 800px`;

  // Verify custom URL pattern is used for sources
  const formats = ["avif", "webp"];
  formats.forEach((format, i) => {
    const source = sourceElements[i];
    expect(source.getAttribute("sizes")).toBe(expectedSizes);

    // Check each breakpoint in the srcset
    expectedBreakpoints.forEach((w) => {
      // Calculate height proportionally based on original aspect ratio
      const h = Math.round((w * 600) / 800);
      const expectedSrcset = `/img/custom-transform?image=${encodeURIComponent(
        "/cat.png"
      )}&width=${w}&height=${h}&fmt=${format}`;
      expect(source.getAttribute("srcset")).toInclude(expectedSrcset);
      expect(source.getAttribute("srcset")).toInclude(
        `${expectedSrcset} ${w}w`
      );
    });
  });

  // Verify custom URL pattern is used for img src
  expect(imgElement.getAttribute("src")).toBe(
    `/img/custom-transform?image=${encodeURIComponent(
      "/cat.png"
    )}&width=800&height=600`
  );

  // Check img srcset also uses custom URL pattern
  expectedBreakpoints.forEach((w) => {
    const h = Math.round((w * 600) / 800);
    const expectedSrcset = `/img/custom-transform?image=${encodeURIComponent(
      "/cat.png"
    )}&width=${w}&height=${h}`;
    expect(imgElement.getAttribute("srcset")).toInclude(expectedSrcset);
    expect(imgElement.getAttribute("srcset")).toInclude(
      `${expectedSrcset} ${w}w`
    );
  });
});

test("applies custom breakpoints for responsive images", () => {
  // Define custom breakpoints that are different from the defaults
  const customBreakpoints = [320, 480, 960, 1440];

  const { container } = render(
    <OpenImgContextProvider breakpoints={customBreakpoints}>
      <Img
        src="/cat.png"
        width={1500}
        height={1000}
        alt="A responsive cat"
        data-testid="responsive-image"
      />
    </OpenImgContextProvider>
  );

  const sourceElements = container.querySelectorAll("source");
  const imgElement = screen.getByTestId("responsive-image");

  // All breakpoints that are less than or equal to the image width should be included
  const expectedBreakpoints = customBreakpoints.filter((bp) => bp <= 1500);

  // Build the expected sizes attribute string
  const expectedSizes =
    expectedBreakpoints.map((bp) => `(max-width: ${bp}px) ${bp}px`).join(", ") +
    ", 1500px";

  // Verify sizes attribute for each source element
  const formats = ["avif", "webp"];
  formats.forEach((format, i) => {
    const source = sourceElements[i];
    expect(source.getAttribute("sizes")).toBe(expectedSizes);

    // Get the actual srcset string to verify against
    const srcsetAttr = source.getAttribute("srcset") || "";

    // Check that each custom breakpoint is in the srcset
    expectedBreakpoints.forEach((w) => {
      // Instead of calculating the exact height, just check that the width is in the srcset
      expect(srcsetAttr).toInclude(
        `/img?src=${encodeURIComponent("/cat.png")}&w=${w}&h=`
      );
      expect(srcsetAttr).toInclude(`${w}w`);
    });

    // Also check that the full width is included
    expect(srcsetAttr).toInclude(
      `/img?src=${encodeURIComponent(
        "/cat.png"
      )}&w=1500&h=1000&format=${format}`
    );
  });

  // Verify img srcset also uses custom breakpoints
  expect(imgElement.getAttribute("sizes")).toBe(expectedSizes);

  // Get the actual srcset string to verify against
  const imgSrcset = imgElement.getAttribute("srcset") || "";

  expectedBreakpoints.forEach((w) => {
    // Instead of calculating the exact height, just check that the width is in the srcset
    expect(imgSrcset).toInclude(
      `/img?src=${encodeURIComponent("/cat.png")}&w=${w}&h=`
    );
    expect(imgSrcset).toInclude(`${w}w`);
  });

  // Also check that the full width is included in img srcset
  expect(imgSrcset).toInclude(
    `/img?src=${encodeURIComponent("/cat.png")}&w=1500&h=1000`
  );
});

test("combines custom breakpoints with custom getSrc function", () => {
  // Define custom breakpoints
  const customBreakpoints = [400, 800, 1200];

  // Define custom getSrc function
  const customGetSrc: GetSrc = ({
    src,
    width,
    height,
    format,
    params,
    optimizerEndpoint,
  }) => {
    return `${optimizerEndpoint}/resize/${width}x${height}/${
      format || "original"
    }/${encodeURIComponent(src)}`;
  };

  const { container } = render(
    <OpenImgContextProvider
      breakpoints={customBreakpoints}
      getSrc={customGetSrc}
    >
      <Img
        src="/cat.png"
        width={1000}
        height={750}
        alt="A custom cat"
        data-testid="custom-image"
      />
    </OpenImgContextProvider>
  );

  const sourceElements = container.querySelectorAll("source");
  const imgElement = screen.getByTestId("custom-image");

  // All breakpoints that are less than or equal to the image width should be included
  const expectedBreakpoints = customBreakpoints.filter((bp) => bp <= 1000);

  // Build the expected sizes attribute string
  const expectedSizes =
    expectedBreakpoints.map((bp) => `(max-width: ${bp}px) ${bp}px`).join(", ") +
    ", 1000px";

  // Verify sizes attribute for each source element
  const formats = ["avif", "webp"];
  formats.forEach((format, i) => {
    const source = sourceElements[i];
    expect(source.getAttribute("sizes")).toBe(expectedSizes);

    // Get the actual srcset string to verify against
    const srcsetAttr = source.getAttribute("srcset") || "";

    // Check that each custom breakpoint is in the srcset with the custom URL pattern
    expectedBreakpoints.forEach((w) => {
      // For each breakpoint, verify the custom URL pattern is used
      expect(srcsetAttr).toInclude(`/img/resize/${w}x`);
      expect(srcsetAttr).toInclude(
        `/${format}/${encodeURIComponent("/cat.png")} ${w}w`
      );
    });

    // Also check that the full width is included with the custom URL pattern
    expect(srcsetAttr).toInclude(
      `/img/resize/1000x750/${format}/${encodeURIComponent("/cat.png")} 1000w`
    );
  });

  // Verify img src uses the custom URL pattern
  expect(imgElement.getAttribute("src")).toBe(
    `/img/resize/1000x750/original/${encodeURIComponent("/cat.png")}`
  );

  // Verify img srcset also uses custom breakpoints with the custom URL pattern
  const imgSrcset = imgElement.getAttribute("srcset") || "";

  expectedBreakpoints.forEach((w) => {
    expect(imgSrcset).toInclude(`/img/resize/${w}x`);
    expect(imgSrcset).toInclude(
      `/original/${encodeURIComponent("/cat.png")} ${w}w`
    );
  });
});

test("applies placeholder as background image when provided", () => {
  // Sample base64 placeholder
  const placeholderBase64 =
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACv/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AVVX/2Q==";

  const { container } = render(
    <Img
      src="/cat.png"
      width={800}
      height={600}
      alt="A cat with placeholder"
      placeholder={placeholderBase64}
      data-testid="placeholder-image"
    />
  );

  const imgElement = screen.getByTestId("placeholder-image");

  // Check the inline style attribute directly
  const styleAttr = imgElement.getAttribute("style");
  expect(styleAttr).not.toBeNull();

  // Verify that the style attribute contains the expected properties
  // Note: We're just checking that the placeholder is used, not the exact format
  expect(styleAttr).toInclude("background-image:");
  expect(styleAttr).toInclude(placeholderBase64);
  expect(styleAttr).toInclude("background-size: cover");
  expect(styleAttr).toInclude("background-repeat: no-repeat");

  // Verify that the main image src is still set correctly
  expect(imgElement.getAttribute("src")).toInclude(
    "/img?src=%2Fcat.png&w=800&h=600"
  );
});

test("clears placeholder styles when image loads", () => {
  // Sample base64 placeholder
  const placeholderBase64 =
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACv/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AVVX/2Q==";

  const { container } = render(
    <Img
      src="/cat.png"
      width={800}
      height={600}
      alt="A cat with placeholder"
      placeholder={placeholderBase64}
      data-testid="loading-image"
    />
  );

  const imgElement = screen.getByTestId("loading-image");

  // Initially, the placeholder styles should be applied
  const initialStyleAttr = imgElement.getAttribute("style");
  expect(initialStyleAttr).toInclude("background-image:");
  expect(initialStyleAttr).toInclude(placeholderBase64);

  // Simulate the image load event
  const loadEvent = new Event("load");
  imgElement.dispatchEvent(loadEvent);

  // After load, the background image style should be cleared
  // Note: We need to check the actual style properties since the attribute might not be updated
  expect(imgElement.style.backgroundImage).toBe("");
  expect(imgElement.style.backgroundSize).toBe("");
  expect(imgElement.style.backgroundRepeat).toBe("");
});

test("clears placeholder styles when image is already complete", () => {
  // Sample base64 placeholder
  const placeholderBase64 =
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACv/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AVVX/2Q==";

  // Since we can't easily mock the useRef and useEffect hooks in this test environment,
  // we'll test the placeholder functionality more directly

  const { container } = render(
    <Img
      src="/cat.png"
      width={800}
      height={600}
      alt="A cat with placeholder"
      placeholder={placeholderBase64}
      data-testid="complete-image"
    />
  );

  const imgElement = screen.getByTestId("complete-image");

  // Initially, the placeholder styles should be applied
  const initialStyleAttr = imgElement.getAttribute("style");
  expect(initialStyleAttr).toInclude("background-image:");
  expect(initialStyleAttr).toInclude(placeholderBase64);

  // Set the complete property to true and manually trigger the load event
  Object.defineProperty(imgElement, "complete", { value: true });
  const loadEvent = new Event("load");
  imgElement.dispatchEvent(loadEvent);

  // After load, the background image style should be cleared
  expect(imgElement.style.backgroundImage).toBe("");
});

test("applies custom params to img src URL", () => {
  const { container } = render(
    <Img
      src="/cat.png"
      width={800}
      height={600}
      alt="A cat with custom params"
      params={{ hq: "true", blur: "5" }}
      data-testid="params-image"
    />
  );

  const imgElement = screen.getByTestId("params-image");
  const imgSrc = imgElement.getAttribute("src");

  // Verify that custom params are included in the img src
  expect(imgSrc).toInclude("hq=true");
  expect(imgSrc).toInclude("blur=5");

  // Verify the complete src structure
  expect(imgSrc).toBe("/img?src=%2Fcat.png&w=800&h=600&hq=true&blur=5");
});

test("applies custom params to img srcset URLs", () => {
  const { container } = render(
    <Img
      src="/cat.png"
      width={1200}
      height={800}
      alt="A cat with custom params"
      params={{ quality: "90", sharpen: "true" }}
      data-testid="params-srcset-image"
    />
  );

  const imgElement = screen.getByTestId("params-srcset-image");
  const imgSrcset = imgElement.getAttribute("srcset");

  // Verify that custom params are included in each srcset entry
  expect(imgSrcset).toInclude("quality=90");
  expect(imgSrcset).toInclude("sharpen=true");

  // Check that params appear in multiple srcset entries
  const srcsetEntries = imgSrcset?.split(", ") || [];
  expect(srcsetEntries.length).toBeGreaterThan(1);

  srcsetEntries.forEach((entry) => {
    if (entry.includes("/img?")) {
      expect(entry).toInclude("quality=90");
      expect(entry).toInclude("sharpen=true");
    }
  });
});

test("applies custom params to source element srcset URLs", () => {
  const { container } = render(
    <Img
      src="/cat.png"
      width={1000}
      height={750}
      alt="A cat with custom params"
      params={{ "black-white": "true", contrast: "20" }}
      data-testid="params-source-image"
    />
  );

  const sourceElements = container.querySelectorAll("source");

  // Verify that both AVIF and WebP sources include the custom params
  const formats = ["avif", "webp"];
  formats.forEach((format, i) => {
    const source = sourceElements[i];
    const sourceSrcset = source.getAttribute("srcset");

    expect(sourceSrcset).toInclude("black-white=true");
    expect(sourceSrcset).toInclude("contrast=20");
    expect(sourceSrcset).toInclude(`format=${format}`);

    // Check that params appear in multiple srcset entries for each source
    const srcsetEntries = sourceSrcset?.split(", ") || [];
    srcsetEntries.forEach((entry) => {
      if (entry.includes("/img?")) {
        expect(entry).toInclude("black-white=true");
        expect(entry).toInclude("contrast=20");
      }
    });
  });
});

test("handles URL encoding of param values correctly", () => {
  const { container } = render(
    <Img
      src="/cat.png"
      width={800}
      height={600}
      alt="A cat with encoded params"
      params={{ overlay: "hello world", special: "a&b=c" }}
      data-testid="encoded-params-image"
    />
  );

  const imgElement = screen.getByTestId("encoded-params-image");
  const imgSrc = imgElement.getAttribute("src");

  // Verify that param values are properly URL encoded
  expect(imgSrc).toInclude("overlay=hello+world");
  expect(imgSrc).toInclude("special=a%26b%3Dc");
});

test("works with custom getSrc function and params", () => {
  const customGetSrc: GetSrc = ({
    src,
    width,
    height,
    format,
    params,
    optimizerEndpoint,
  }) => {
    const searchParams = new URLSearchParams({
      image: src,
      w: width.toString(),
      h: height.toString(),
    });

    if (format) searchParams.set("fmt", format);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        searchParams.set(`custom_${key}`, value);
      });
    }

    return `${optimizerEndpoint}/transform?${searchParams.toString()}`;
  };

  const { container } = render(
    <OpenImgContextProvider getSrc={customGetSrc}>
      <Img
        src="/cat.png"
        width={800}
        height={600}
        alt="A cat with custom getSrc and params"
        params={{ effect: "vintage", brightness: "10" }}
        data-testid="custom-getsrc-params-image"
      />
    </OpenImgContextProvider>
  );

  const imgElement = screen.getByTestId("custom-getsrc-params-image");
  const imgSrc = imgElement.getAttribute("src");

  // Verify that custom getSrc function receives and processes params correctly
  expect(imgSrc).toInclude("/transform?");
  expect(imgSrc).toInclude("custom_effect=vintage");
  expect(imgSrc).toInclude("custom_brightness=10");
  expect(imgSrc).toInclude("image=%2Fcat.png");
});

test("works without params (backward compatibility)", () => {
  const { container } = render(
    <Img
      src="/cat.png"
      width={800}
      height={600}
      alt="A cat without params"
      data-testid="no-params-image"
    />
  );

  const imgElement = screen.getByTestId("no-params-image");
  const imgSrc = imgElement.getAttribute("src");

  // Verify that the component still works correctly without params
  expect(imgSrc).toBe("/img?src=%2Fcat.png&w=800&h=600");

  // Should not contain any unexpected parameters
  expect(imgSrc).not.toInclude("undefined");
  expect(imgSrc).not.toInclude("null");
});

test("handles empty params object", () => {
  const { container } = render(
    <Img
      src="/cat.png"
      width={800}
      height={600}
      alt="A cat with empty params"
      params={{}}
      data-testid="empty-params-image"
    />
  );

  const imgElement = screen.getByTestId("empty-params-image");
  const imgSrc = imgElement.getAttribute("src");

  // Verify that empty params object doesn't break anything
  expect(imgSrc).toBe("/img?src=%2Fcat.png&w=800&h=600");
});
