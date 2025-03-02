import { runMetadataTests } from "../../shared/test-runner-metadata.js";
import { getImgMetadata } from "openimg/node";

// Configure the Node.js-specific metadata tests
runMetadataTests({
  type: "node",
  getImgMetadata,
});
