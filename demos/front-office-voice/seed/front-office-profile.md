# Front-office profile for the support-voice line

> SYNTHETIC. A neutral profile for a practice-management software vendor's support line. Load it into the
> support-voice story's prospect-profile slot (L9, `demos/support-voice/`) once that exists. Its exact file
> format is defined there; this file holds the content only.

## Who calls

Front-desk staff and office managers at practices that use {prospect}'s software. They are not patients.
They may mention a patient while describing a problem; the line must never ask for patient identifiers.

## Products the voice agent knows

| Product | What callers ask about |
| --- | --- |
| Appointments | Rescheduling, double-booked chairs, reminder texts not sending |
| Recall reminders | Six-month hygiene recalls, patients missing from a recall list |
| Patient portal | Login problems, intake forms, a broken link in a reminder |
| Messages | Secure messages not reaching the practice inbox |
| Insurance and billing | Whether eligibility checks are supported, where a claim status shows |

## Voice keyterms

recall list, hygiene recall, chair, operatory, reschedule, intake form, eligibility check, portal, reminder text

## Intents and routes

| Intent | Route | Outcome |
| --- | --- | --- |
| how-to the docs already answer | answer on the call | No ticket |
| how-to the docs do not answer | `kb_gap` | GIO ticket, then a KB article draft PR |
| product bug | `bug` | GIO ticket, then a fix draft PR |

## Disclaimer the voice agent reads first

"This is a demo line with synthetic data. Please do not share real patient information."
