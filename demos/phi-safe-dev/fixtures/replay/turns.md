REPLAY (no key)

Recorded agent turn for the hygiene recall bug. Synthetic twins only.

The front-desk note says a patient with a hygiene visit on the 31st is missing from the February recall list and shows up in March. Date#setUTCMonth rolls 31 August plus six months to 3 March, because February has no 31st. The due date should clamp to the last day of the target month, so every end-of-month visit is fixed, not one patient.

The offline ticket is the raw seed note passed through redact(). The raw note stays in seed/.
