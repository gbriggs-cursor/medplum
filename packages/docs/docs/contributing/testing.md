---
sidebar_position: 50
---

# Testing

Medplum strongly believes in the importance of testing.

We use the following tools for testing:

- [Vitest](https://vitest.dev/) as the primary test runner (`vitest run` in each package `package.json`)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) for React testing
  - [@testing-library/dom](https://www.npmjs.com/package/@testing-library/dom) - DOM testing utilities
  - [@testing-library/jest-dom](https://www.npmjs.com/package/@testing-library/jest-dom) - DOM matchers
  - [@testing-library/react](https://www.npmjs.com/package/@testing-library/react) - Ties it all together: Vitest, React, and DOM

Every pull request is analyzed by [Sonarcloud](https://sonarcloud.io/project/overview?id=medplum_medplum) and [Coveralls](https://coveralls.io/github/medplum/medplum?branch=main) for code coverage and other static analysis.

## How to test

To run all tests for all packages, use the build script:

```bash
npm t
```

To run all tests for a single package, use `npm t` inside the package folder:

```bash
cd packages/app
npm t
```

To run tests for a single file, pass in the file name:

```bash
npm t -- src/App.test.tsx
```

To run a single test in a single file, pass the file name and the test name:

```bash
npm t -- src/App.test.tsx -t 'Click logo'
```

Any time you run `npm t`, you can optionally pass in `--coverage` to collect code coverage stats. They will be printed in the terminal:

```bash
npm t -- --coverage
npm t -- src/App.test.tsx --coverage
npm t -- src/App.test.tsx -t 'Click logo' --coverage
```
