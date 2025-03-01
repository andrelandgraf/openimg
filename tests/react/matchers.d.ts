import { TestingLibraryMatchers } from "@testing-library/jest-dom/matchers";

declare module "bun:test" {
  interface Matchers<T>
    extends TestingLibraryMatchers<typeof expect.stringContaining, T> {
    /**
     * Check if a string includes another string
     * @param expected The string that should be included
     */
    toInclude(expected: string): boolean;
  }
  interface AsymmetricMatchers extends TestingLibraryMatchers<any, any> {
    /**
     * Check if a string includes another string
     * @param expected The string that should be included
     */
    toInclude(expected: string): boolean;
  }
}
