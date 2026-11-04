// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { brand, theme, tokens } from './theme';

test('brand tokens match official Anatomy corporate light', () => {
  expect(brand.productName).toBe('Boston Scientific CDx Patient Portal');
  expect(brand.pageTitle).toBe('Boston Scientific CDx Patient Portal');
  expect(tokens.brandPrimary).toBe('#003c71');
  expect(tokens.logoPrimary).toBe('#00467f');
  expect(tokens.actionPrimary40).toBe('#0153cc');
  expect(theme.primaryColor).toBe('bsc');
  expect(theme.primaryShade).toBe(5);
  expect(theme.colors?.bsc?.[5]).toBe(tokens.actionPrimary40);
});
