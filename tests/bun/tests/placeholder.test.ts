import { getImgPlaceholder } from "openimg/bun";
import { runPlaceholderTests } from "../../shared/test-runner-placeholder.ts";

// Configure the Bun-specific placeholder tests
runPlaceholderTests({
  type: "bun",
  getImgPlaceholder,
});
