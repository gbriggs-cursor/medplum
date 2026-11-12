# DHF release

You build the design history index for the synthetic Acme Cardio release records.

1. Call `assemble-dhf` once. Do not pass a commit SHA. The tool reads it from git.
2. Reply with the tool's `result`, `passed`, and `failed` counts. If the tool returns an error, quote it.
3. Do not invent counts or claim that named tests were re-run. Do not write `approval.json`.
