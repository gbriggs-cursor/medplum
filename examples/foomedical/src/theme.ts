// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { createTheme } from '@mantine/core';
import type { MantineColorsTuple } from '@mantine/core';

/** BSCI CDx tokens from Anatomy corporate light. Import from here — see demos/design/_brands/bsci/brand.md. */
export const brand = {
  productName: 'Boston Scientific CDx Patient Portal',
  legalName: 'Boston Scientific',
  tagline: 'Advancing science for life',
  fonts: {
    regular: 'SST-Roman, Arial, Helvetica, sans-serif',
    heavy: 'SST-Heavy, Arial, Helvetica, sans-serif',
  },
  colors: {
    brandPrimary: '#003C71',
    logoPrimary: '#00467F',
    logoSecondary: '#6A737B',
    action10: '#001433',
    action20: '#012965',
    action40: '#0153CC',
    /** 3.54:1 on white — large text / UI only, never small text. */
    action60: '#3485FE',
    action80: '#9AC2FE',
    action95: '#E6F0FF',
    action97: '#F2F7FF',
    neutral00: '#000000',
    neutral40: '#666666',
    neutral95: '#F2F2F2',
    neutral100: '#FFFFFF',
    error: '#B31921',
  },
} as const;

export const copy = {
  signInTitle: `Sign in to ${brand.productName}`,
  registerTitle: `Register with ${brand.productName}`,
  welcomeTitle: `Welcome to ${brand.productName}`,
  recordsDescription: `Get records sent to or from ${brand.productName}.`,
  smartHealthLinkLabel: 'CDx patient share',
  announcement: 'Demo environment. All records are synthetic. No real patient data is used.',
  landingTitleLead: 'Companion diagnostics',
  landingTitleHighlight: 'patient portal',
  landingSubtitle:
    'Access your companion diagnostic results, care plan, and messages in one place. This demo uses synthetic data only — never PHI.',
  landingHealthcareEyebrow: 'CDx care',
  landingHealthcareTitle: 'A better way to stay connected',
  landingHealthcareBody: 'Review results, message your care team, and manage next steps from a single patient portal.',
  getStarted: 'Get started',
  sourceCode: 'Source code',
} as const;

export function footerCopyright(year: number): string {
  return `© ${year} ${brand.legalName}. All rights reserved.`;
}

/** Anatomy action + brand navy. Shade 6 is #003C71 (11.14:1 on white). Shade 3 fails AA for small text. */
const bsci: MantineColorsTuple = [
  '#f2f7ff',
  '#e6f0ff',
  '#9ac2fe',
  '#3485fe',
  '#0153cc',
  '#0142a3',
  '#003c71',
  '#012965',
  '#001433',
  '#000a1f',
];

export const theme = createTheme({
  primaryColor: 'bsci',
  primaryShade: 6,
  colors: { bsci },
  black: brand.colors.neutral00,
  fontFamily: brand.fonts.regular,
  headings: {
    fontFamily: brand.fonts.heavy,
    fontWeight: '700',
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
    Anchor: {
      defaultProps: {
        c: 'bsci.4',
      },
    },
  },
});
