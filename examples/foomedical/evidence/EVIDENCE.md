Requirement: The Foo Medical patient device card reads battery-percent from a synthetic Device and shows Low battery only when that value is below 20%.
Change: examples/foomedical/src/components/DeviceCard.tsx, examples/foomedical/src/pages/health-record/Devices.tsx, examples/foomedical/src/pages/health-record/index.tsx, examples/foomedical/src/Router.tsx
Test: npm test --workspace foomedical -- src/components/DeviceCard.test.tsx src/pages/health-record/Devices.test.tsx
Result: pass (8 passed, 0 failed)
Synthetic: true
Commit: 60528226fc4ca4656cac44f19e0e72ff273f22a0

| Requirement | Test | Run | Result |
| --- | --- | --- | --- |
| Device card reads battery-percent from Device.property using system https://foo-medical.example/device-property, code battery-percent, and valueQuantity unit %. | reads battery-percent and shows Low battery below 20 | npm test --workspace foomedical -- src/components/DeviceCard.test.tsx src/pages/health-record/Devices.test.tsx, 2026-11-16 | pass |
| Badge shows "Low battery" when the value is below 20. | reads battery-percent and shows Low battery below 20 | npm test --workspace foomedical -- src/components/DeviceCard.test.tsx src/pages/health-record/Devices.test.tsx, 2026-11-16 | pass |
| No badge when the property is missing or the value is at least 20. | shows no badge when the property is missing; shows the level and no badge at 20 | npm test --workspace foomedical -- src/components/DeviceCard.test.tsx src/pages/health-record/Devices.test.tsx, 2026-11-16 | pass |

## Test log

```text

> foomedical@5.2.14 test
> vitest run src/components/DeviceCard.test.tsx src/pages/health-record/Devices.test.tsx


 RUN  v4.1.12 /agent/repos/medplum/examples/foomedical


 Test Files  2 passed (2)
      Tests  8 passed (8)
   Start at  02:55:00
   Duration  2.90s (transform 1.25s, setup 124ms, import 2.40s, tests 443ms, environment 903ms)

EXIT:0
```
