export default {
  // Indicates that the code coverage information should be collected while executing the test
  collectCoverage: true,
  // The directory where Jest should output its coverage files
  coverageDirectory: "coverage",
  // A list of paths to directories that Jest should use to search for files in
  roots: [
    "<rootDir>/tests"
  ],
  // The test environment that will be used for testing
  testEnvironment: "node",
  // Support for ES modules
  transform: {}, // Important for projects using ES modules without Babel
  // Mocks for CSS and other static assets if they cause issues during import
  moduleNameMapper: {
     "\\.(css|less|scss|sass)$": "identity-obj-proxy" // Mocks CSS imports
  }
};
