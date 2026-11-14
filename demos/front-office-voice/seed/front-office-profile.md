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

| Product               | What callers ask about                                               |
| --------------------- | -------------------------------------------------------------------- |
| Appointments          | Rescheduling, double-booked chairs, reminder texts not sending       |
| Recall reminders      | Six-month hygiene recalls, patients missing from a recall list       |
| Patient portal        | Login problems, intake forms, a broken link in a reminder            |
| Messages              | Secure messages not reaching the practice inbox                      |
| Insurance and billing | Whether eligibility checks are supported, where a claim status shows |

## Voice keyterms

recall list, hygiene recall, chair, operatory, reschedule, intake form, eligibility check, portal, reminder text

## Routes

The front-office route (`lib/route.mjs`) answers from the staff articles in `kb/staff/` (FO-101 to FO-104), not from
L9's patient articles. Bug and clinical signals use L9's triage rules unchanged.

| Intent                         | Route      | Outcome        |
| ------------------------------ | ---------- | -------------- |
| how-to a staff article covers  | `answered` | No ticket      |
| how-to no staff article covers | `kb_gap`   | Dry-run ticket |
| product bug                    | `bug`      | Dry-run ticket |

## Disclaimer

"This is a demo line with synthetic data. Please do not share real patient information."
