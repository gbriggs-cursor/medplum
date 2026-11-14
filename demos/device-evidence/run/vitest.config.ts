// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    root: import.meta.dirname,
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    testTimeout: 60000,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      // generate.ts only writes buildCohort() output to disk.
      exclude: ['src/**/*.test.{ts,tsx}', 'src/test.setup.ts', 'src/generate.ts'],
      reporter: [['text', { skipFull: false }], 'json-summary', 'html'],
      // The repo .gitignore drops any folder named coverage/, so the committed report uses another name.
      reportsDirectory: './evidence/coverage-report',
    },
  },
});
