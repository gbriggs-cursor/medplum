// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { theme, tokens } from './theme';

function luminance(hex: string): number {
  const [r, g, b] = (hex.replace('#', '').match(/../g) as string[])
    .map((c) => Number.parseInt(c, 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// Mantine's light variant is the primary color at 10% alpha over the surface.
function overSurface(hex: string, alpha: number): string {
  const fg = hex.replace('#', '').match(/../g) as string[];
  const bg = tokens.surface.replace('#', '').match(/../g) as string[];
  return (
    '#' +
    fg
      .map((c, i) => Math.round(alpha * Number.parseInt(c, 16) + (1 - alpha) * Number.parseInt(bg[i], 16)))
      .map((c) => c.toString(16).padStart(2, '0'))
      .join('')
  );
}

const cardio = theme.colors?.cardio as readonly string[];
const primaryLight = overSurface(tokens.primary, 0.1);

test.each([
  ['text on surface', tokens.text, tokens.surface],
  ['muted text on surface', tokens.mutedText, tokens.surface],
  ['primary on surface', tokens.primary, tokens.surface],
  ['surface on primary', tokens.surface, tokens.primary],
  ['surface on primary hover', tokens.surface, cardio[8]],
  ['surface on primary dark', tokens.surface, tokens.primaryDark],
  ['accent on surface', tokens.accent, tokens.surface],
  ['primary on primary light', tokens.primary, primaryLight],
  ['text on primary light', tokens.text, primaryLight],
])('%s meets WCAG AA for normal text', (_name, fg, bg) => {
  expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
});

test('primary shade is the brand primary', () => {
  expect(cardio[theme.primaryShade as number]).toBe(tokens.primary);
});
