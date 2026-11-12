# L11 PHI tripwire

**Setup line:** "Someone pastes a real-looking patient note into a support ticket. What stops it reaching Jira?"

**Wow line:** "The name, MRN, birth date and phone are gone before Jira sees anything, and a note we can't clean is refused outright."

All data is synthetic (P3 pack, `demos/_shared/data-packs/p3-phi-like`).

## Flow

1. **Raw screen.** The pasted text is screened. Any hit means the raw text is never stored (this mirrors the Grok Bot PHI screen).
2. **Redact with chart context.** The patient's own identifiers (from their Medplum record, as L10 keeps them) and the pattern rules replace identifiers with typed placeholders.
3. **Tripwire.** The redacted text is screened again by the pattern screen, a strict screen (any 5+ digit run, any `@`), and one rule: no chart context means no automatic write.
4. **Jira (dry-run).** If clean, a GIO ticket JSON is written to `run/outbox/` with labels `demo, medplum, story:phi-tripwire, track:ls, stage:floor`. Otherwise nothing is written and the note goes to a human.

## Key-free (no API keys)

This is the default. There is no model step. With the Jira keys unset, the banner and the first line of `run/outbox/<note>.json` say `OFFLINE (no key)`. The story does not call Jira.

```bash
node demos/phi-tripwire/scripts/tripwire.mjs --note P3-N-001
```

`DEMO_MODE=live` without `JIRA_BASE_URL`, `JIRA_EMAIL`, and `JIRA_API_KEY` prints `BLOCKED` and exits 3. With those set, the file is the same payload without the OFFLINE label, and this story still does not post to Jira.

## Run it

```bash
cd demos/phi-tripwire
./reset.sh
npm test        # pack determinism, fictional ranges, span offsets, tripwire rules
npm run eval    # scorecard over all 50 P3 notes
node scripts/tripwire.mjs --note P3-N-001
node scripts/tripwire.mjs --note P3-N-003 --blind
node scripts/tripwire.mjs --note P3-R-001
```

## What the scorecard says

With chart context, every planted identifier in the 48 patient notes is removed, and the 2 notes without a chart are refused. Blind (no chart context), the pattern rules alone catch about 74%: town names and uncommon given names slip through. That is why the no-chart-context rule exists. The chart-context recall is partly by construction, because the chart holds the same values the notes plant. Treat it as "known identifiers are reliably removed", not as a general de-identification score.

## Fallback

Show the eval scorecard in `evidence/test-log.txt`.
