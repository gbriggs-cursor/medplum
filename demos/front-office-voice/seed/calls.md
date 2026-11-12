# Scripted synthetic callers

> SYNTHETIC. The presenter plays the caller. Callers are invented office staff at Foo Dental, a fictional practice that uses {prospect}'s software.

Submit these on the L9 support form (`http://127.0.0.1:8787`). There is no phone call without `XAI_API_KEY`.
The ticket, if triage writes one, is dry-run JSON in `demos/support-voice/run/outbox/`. Nothing below has been
run through that server for this story.

## reschedule

"Hi, this is Dana at Foo Dental's Lakeside office. How do I move a patient's cleaning to next Tuesday without losing
the reminder?" Intended route: answered from the KB, no ticket. The committed KB article is a patient
reschedule how-to (`KB-302`), not a front-desk one, so triage may not answer it.

## kb_gap

"Hi, this is Sam, office manager at Foo Dental's Northgate office. Does {prospect} run insurance eligibility checks before
the visit, or do we still call the payer?" Intended route: `kb_gap` dry-run ticket. This story does not open a KB PR.

## bug

"Hi, it's Priya at Foo Dental's Riverside office. A patient told us she never got her six-month recall reminder. She had
her cleaning on August 31st." Intended route: do not take the patient's name or date of birth. Redaction is
`demos/_shared/phi/redact.mjs`. The recall defect itself is story G8 (`demos/phi-safe-dev/`). This story does not open a fix PR.
