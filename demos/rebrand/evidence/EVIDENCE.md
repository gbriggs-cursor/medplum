Requirement: Foo Medical is rebranded as the Acme Cardio Companion patient portal from the committed brand kit, with tokens in one theme file and brand color pairs at WCAG AA.
Change: Added examples/foomedical/src/theme.ts and theme.test.ts, replaced the logo and favicon (src/img/logo.svg, src/img/favicon.svg), and rebranded copy in index.html, Footer.tsx, HomePage.tsx, SignInPage.tsx, RegisterPage.tsx, SmartHealthLinksPage.tsx, and landing/index.tsx.
Test: cd examples/foomedical && npx vitest run
Result: pass (17 passed, 0 failed)
Synthetic: true
Commit: e2d5a782060a5c4dcf8f3fd1201a78f98c842d8a

| Requirement | Test | Run | Result |
| --- | --- | --- | --- |
| Brand color tokens live in one theme file and the Mantine primary shade is the brand primary. | primary shade is the brand primary | cd examples/foomedical && npx vitest run, 2026-11-14 | pass |
| Brand color pairs rendered by the app meet WCAG AA (4.5:1) for normal text. | %s meets WCAG AA for normal text (9 cases) | cd examples/foomedical && npx vitest run, 2026-11-14 | pass |
| The rebranded app still renders and existing behavior is unchanged. | cd examples/foomedical && npx vitest run | cd examples/foomedical && npx vitest run, 2026-11-14 | pass |

## Test log

```

 RUN  v4.1.12 /agent/repos/medplum/examples/foomedical


 Test Files  3 passed (3)
      Tests  17 passed (17)
   Start at  16:16:46
   Duration  2.00s (transform 1.50s, setup 198ms, import 2.35s, tests 278ms, environment 1.13s)

EXIT:0
```
