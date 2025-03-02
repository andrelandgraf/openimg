import { runPlaceholderTests } from "../../shared/test-runner-placeholder.js";
import { getImgPlaceholder } from "openimg/node";

// Configure the Node.js-specific placeholder tests
runPlaceholderTests({
  type: "node",
  getImgPlaceholder,
});
