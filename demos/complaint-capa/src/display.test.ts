import assert from 'node:assert/strict';
import { test } from 'node:test';
import { confirmedPressure } from './display.ts';
import { CMP_001_DISPLAY, CMP_001_LATER_READING } from './fixtures.ts';
import type { PressureSample } from './types.ts';

test('CMP-001 does not confirm 90/50 mmHg taken after pairing failed', () => {
  const confirmed = confirmedPressure([CMP_001_DISPLAY]);
  assert.equal(confirmed, undefined);
});

test('a later paired reading remains the confirmed display', () => {
  const confirmed = confirmedPressure([CMP_001_DISPLAY, CMP_001_LATER_READING]);
  assert.deepEqual(confirmed, CMP_001_LATER_READING);
});

test('an unpaired sample is withheld when the subject did not dispute it', () => {
  const unpaired: PressureSample = { systolic: 122, diastolic: 78, paired: false, disputed: false };
  assert.equal(confirmedPressure([unpaired]), undefined);
});

test('a paired sample is withheld when the subject disputed it', () => {
  const disputed: PressureSample = { systolic: 90, diastolic: 50, paired: true, disputed: true };
  assert.equal(confirmedPressure([disputed]), undefined);
});
