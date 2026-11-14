# Scripted synthetic callers

> SYNTHETIC. The presenter plays the caller. Callers are invented office staff at Foo Dental, a fictional practice that uses {prospect}'s software.

`node demos/front-office-voice/run.mjs` replays these through the L9 confirm and redaction, then the front-office route
(`lib/route.mjs`). Bug and clinical signals use L9's triage rules unchanged. "Answered" is decided against the
staff-facing front-desk articles in `kb/staff/`, with L9's score and coverage thresholds. L9's patient articles are not
used to answer front-desk callers.

The L9 form server (`demos/support-voice/server.mjs`) does not use this route. It still triages against patient articles.

## reschedule (answered)

"Hi, this is Dana at Foo Dental's Lakeside office. How do I move a patient's cleaning to next Tuesday without losing
the reminder?" Lands on `answered` with `FO-101`.

## kb_gap

"Hi, this is Sam, office manager at Foo Dental's Northgate office. Does {prospect} run insurance eligibility checks before
the visit, or do we still call the payer?" Lands on `kb_gap`: no staff article covers eligibility.

## bug

"Hi, it's Priya at Foo Dental's Riverside office. Our recall list shows the wrong date for cleanings on the 31st. A patient
seen August 31st lands on the March list instead of February, so she never got her reminder." Lands on `bug` through L9's
"shows the wrong date" defect rule. Do not take the patient's name or date of birth. The recall defect itself is story G8
(`demos/phi-safe-dev/`). This story does not open a fix PR.
