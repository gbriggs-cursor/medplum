# Prompt: speech to FHIR

Spoken by the presenter as the caller (Grok Voice), or typed into the support form with the server started with `--medplum`. All details are invented.

> Hi, I'm calling {prospect} support. My name is Dana Whitfield, born July 2nd, 1958. I got a new phone and my Acme Cardio patch won't pair with it. You can call me back at (617) 555-0100.

Without voice, run the same transcript:

```bash
node demos/speech-to-fhir/scripts/run.mjs --transcript pairing
```
