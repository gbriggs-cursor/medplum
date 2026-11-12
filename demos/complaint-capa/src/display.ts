import type { PressureSample } from './types.ts';

export function confirmedPressure(samples: readonly PressureSample[]): PressureSample | undefined {
  let confirmed: PressureSample | undefined;
  for (const sample of samples) {
    if (sample.paired && !sample.disputed) {
      confirmed = sample;
    }
  }
  return confirmed;
}
