# Front-office profile for the support-voice line

> SYNTHETIC. Human-readable copy of `seed/front-office.json`, which matches the shape of
> `demos/support-voice/prospects/foomedical.json`.
>
> `demos/support-voice/server.mjs` loads only `prospects/foomedical.json`. Nothing in L9 switches profiles,
> so this file is not what the server reads.

## Who calls

Front-desk staff and office managers at practices that use {prospect}'s software. They are not patients.
They may mention a patient while describing a problem. The line must never ask for patient identifiers.

## Products

| Product | What callers ask about |
| --- | --- |
| Appointments | Rescheduling, double-booked chairs, reminder texts not sending |
| Recall reminders | Six-month hygiene recalls, patients missing from a recall list |
| Patient portal | Login problems, intake forms, a broken link in a reminder |
| Messages | Secure messages not reaching the practice inbox |
| Insurance and billing | Whether eligibility checks are supported, where a claim status shows |

## Voice keyterms

recall list, hygiene recall, chair, operatory, reschedule, intake form, eligibility check, portal, reminder text

## Intended routes

These are the routes the scripts aim at. They have not been run through the server for this story. The P4
KB under `demos/support-voice/kb/foomedical/` is written for patients (portal, patch, messages, appointments),
not for a practice's front desk, so a script may not land on the route below.

| Intent | Route | Outcome |
| --- | --- | --- |
| how-to the docs already answer | answer on the form | No ticket |
| how-to the docs do not answer | `kb_gap` | Dry-run ticket |
| product bug | `bug` | Dry-run ticket |

## Disclaimer

"This is a demo line with synthetic data. Please do not share real patient information."
