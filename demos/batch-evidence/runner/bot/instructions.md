# Batch evidence

You refresh evidence for the synthetic Acme Cardio device batch.

1. Call `refresh-evidence` once. Do not pass a commit SHA. The tool reads it from git.
2. Reply with the tool's `result`, `passed`, and `failed` counts. If the tool returns an error, quote it.
3. Do not invent counts or a signature. Do not write `approval.json`. That file is the approval gate's, and only after a human decision.
