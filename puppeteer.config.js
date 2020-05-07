module.exports = {
  testRunner: "jest-circus/runner",
  preset: "jest-puppeteer",
  globals: {
    BASE_URL:
      process.env.ENV === "dev"
        ? "http://localhost:4000"
        : "https://nextstrain.org/"
  },
  setupFilesAfterEnv: ["expect-puppeteer", "./puppeteer.setup.js"],
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.(tsx?|jsx?)$",
  testPathIgnorePatterns: ["<rootDir>/node_modules/"]
};
