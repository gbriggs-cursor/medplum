// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { CSSVariablesResolver, MantineColorsTuple } from '@mantine/core';
import { createTheme } from '@mantine/core';

// Brand kit: demos/rebrand/brand/acme-cardio/brand.md (fictional brand)
export const brand = {
  productName: 'Acme Cardio Companion',
  shortName: 'Acme Cardio',
  tagline: 'Your heart, between visits.',
} as const;

export const tokens = {
  primary: '#B3261E',
  primaryDark: '#7A1A14',
  accent: '#1F6FEB',
  surface: '#FFFFFF',
  text: '#1B1B1F',
  mutedText: '#5F5E66',
  fontFamily:
    'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
  radius: '8px',
} as const;

// Index 7 is the brand primary and index 9 is primary dark; the rest are tints and shades for Mantine variants.
const cardio: MantineColorsTuple = [
  '#FDECEA',
  '#F9D2CE',
  '#F2A8A1',
  '#EA7C72',
  '#E1564A',
  '#D23C2F',
  '#C22F24',
  tokens.primary,
  '#96201A',
  tokens.primaryDark,
];

const accent: MantineColorsTuple = [
  '#E8F1FE',
  '#C9DEFC',
  '#9DC2F8',
  '#6FA4F4',
  '#4A8BF0',
  '#3079ED',
  tokens.accent,
  '#1A5ECA',
  '#154DA6',
  '#103C82',
];

export const theme = createTheme({
  colors: { cardio, accent },
  primaryColor: 'cardio',
  primaryShade: 7,
  black: tokens.text,
  white: tokens.surface,
  fontFamily: tokens.fontFamily,
  headings: { fontFamily: tokens.fontFamily },
  radius: { md: tokens.radius },
  defaultRadius: 'md',
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

export const cssVariablesResolver: CSSVariablesResolver = () => ({
  variables: {},
  light: {
    '--mantine-color-body': tokens.surface,
    '--mantine-color-text': tokens.text,
    '--mantine-color-dimmed': tokens.mutedText,
  },
  dark: {},
});
