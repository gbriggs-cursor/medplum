# Scripted synthetic callers

> SYNTHETIC. The presenter plays the caller. Callers are invented office staff at Foo Dental, a fictional practice that uses {prospect}'s software.

## reschedule (answered on the call, no ticket)

"Hi, this is Dana at Foo Dental's Lakeside office. How do I move a patient's cleaning to next Tuesday without losing
the reminder?" Expected: the voice agent answers from the Appointments articles. No ticket.

## kb_gap (KB article PR)

"Hi, this is Sam, office manager at Foo Dental's Northgate office. Does {prospect} run insurance eligibility checks before
the visit, or do we still call the payer?" Expected: triage finds no article that answers it, files a GIO
ticket routed `kb_gap`, and the bot opens a draft PR adding a front-office help article.

## bug (fix PR)

"Hi, it's Priya at Foo Dental's Riverside office. A patient told us she never got her six-month recall reminder. She had
her cleaning on August 31st." Expected: the line declines to take the patient's name or date of birth,
redaction (L11) strips anything the caller volunteers, triage routes `bug`, and the fix agent picks up the
same recall defect as story G8 (`demos/phi-safe-dev/`).
