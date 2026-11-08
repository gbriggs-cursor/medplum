// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'payments-checkout',
    root: import.meta.dirname,
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
