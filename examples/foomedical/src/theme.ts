// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { MantineColorsTuple } from '@mantine/core';
import { createTheme } from '@mantine/core';

export const brand = {
  productName: 'Boston Scientific CDx Patient Portal',
  productShortName: 'BSCI CDx',
  companyName: 'Boston Scientific Corporation',
  welcomeTitle: 'Welcome to Boston Scientific CDx',
  signInTitle: 'Sign in to Boston Scientific CDx Patient Portal',
  registerTitle: 'Register with Boston Scientific CDx Patient Portal',
  recordsDescription: 'Get records sent to or from Boston Scientific.',
  shareLabel: 'BSCI CDx patient share',
  pageTitle: 'Boston Scientific CDx Patient Portal',
  landingTitleLead: 'An extraordinary',
  landingTitleHighlight: 'CDx patient portal',
  landingSubtitle:
    'This is a Boston Scientific CDx patient portal demo. It uses synthetic data only — not a live clinical system.',
  landingSectionEyebrow: 'Companion diagnostics',
  landingSectionTitle: 'Stay connected to your care',
} as const;

export const tokens = {
  brandPrimary: '#003c71',
  logoPrimary: '#00467f',
  logoSecondary: '#6a737b',
  actionPrimary97: '#f2f7ff',
  actionPrimary95: '#e6f0ff',
  actionPrimary80: '#9ac2fe',
  actionPrimary60: '#3485fe',
  actionPrimary40: '#0153cc',
  actionPrimary20: '#012965',
  actionPrimary10: '#001433',
  accentSecondary60: '#00eeff',
  accentSecondary40: '#00becc',
  accentPrimary60: '#bb33ff',
  accentPrimary30: '#660099',
  neutral00: '#000000',
  neutral10: '#1a1a1a',
  neutral20: '#333333',
  neutral40: '#666666',
  neutral60: '#999999',
  neutral80: '#cccccc',
  neutral95: '#f2f2f2',
  neutral100: '#ffffff',
  fontFamily: "'SST-Roman', 'Helvetica Neue', Helvetica, Arial, sans-serif",
  fontFamilyHeavy: "'SST-Heavy', 'Helvetica Neue', Helvetica, Arial, sans-serif",
} as const;

const bsc: MantineColorsTuple = [
  tokens.actionPrimary97,
  tokens.actionPrimary95,
  tokens.actionPrimary95,
  tokens.actionPrimary80,
  tokens.actionPrimary60,
  tokens.actionPrimary40,
  tokens.logoPrimary,
  tokens.brandPrimary,
  tokens.actionPrimary20,
  tokens.actionPrimary10,
];

export const theme = createTheme({
  primaryColor: 'bsc',
  primaryShade: 5,
  colors: { bsc },
  fontFamily: tokens.fontFamily,
  headings: {
    fontFamily: tokens.fontFamilyHeavy,
  },
  fontSizes: {
    xs: '0.6875rem',
    sm: '0.875rem',
    md: '0.875rem',
    lg: '1rem',
    xl: '1.125rem',
  },
  components: {
    Container: {
      defaultProps: {
        size: 1200,
      },
    },
  },
});
