import { getImgMetadata } from "openimg/bun";
import { runMetadataTests } from "../../shared/test-runner-metadata.ts";

// Configure the Bun-specific metadata tests
runMetadataTests({
  type: "bun",
  getImgMetadata,
});
