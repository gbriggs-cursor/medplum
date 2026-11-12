import { ClientStorage, MedplumClient, MemoryStorage } from '@medplum/core';
import { createHash, randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { storyTags } from '../../_shared/fhir/tags.mjs';
import { INTAKE_IDENTIFIER_SYSTEM, toQuestionnaireResponse } from './to-questionnaire-response.mjs';

export const PATIENT_IDENTIFIER_SYSTEM = 'https://foomedical.example/synthetic/patient';

// Local dev server only. The defaults are the credentials the local server seeds on first boot.
export async function connect(env = process.env) {
  const baseUrl = env.MEDPLUM_BASE_URL ?? 'http://localhost:8103/';
  const storage = new ClientStorage(new MemoryStorage());
  const medplum = new MedplumClient({ baseUrl, fetch, storage });
  // @medplum/core's built-in PKCE helper expects a browser `window`; under Node we supply the S256 pair ourselves.
  const verifier = randomBytes(32).toString('base64url');
  storage.setString('codeVerifier', verifier);
  const login = await medplum.startLogin({
    email: env.MEDPLUM_EMAIL ?? 'admin@example.com',
    password: env.MEDPLUM_PASSWORD ?? 'medplum_admin',
    codeChallenge: createHash('sha256').update(verifier).digest('base64url'),
    codeChallengeMethod: 'S256',
  });
  await medplum.processCode(login.code);
  return medplum;
}

export async function seedQuestionnaire(medplum) {
  const q = JSON.parse(readFileSync(new URL('../seed/questionnaire.json', import.meta.url), 'utf8'));
  return medplum.createResourceIfNoneExist(q, `url=${encodeURIComponent(q.url)}`);
}

/** Finds the synthetic patient by name + birth date, or creates one tagged synthetic. */
export async function findOrCreatePatient(medplum, name, birthDate) {
  const [given, ...rest] = name.split(' ');
  const family = rest.join(' ');
  const found = await medplum.searchOne('Patient', { given, family, birthdate: birthDate, _tag: 'HTEST' });
  if (found) {
    return { patient: found, created: false };
  }
  const slug = `${given}-${family}-${birthDate}`.toLowerCase().replace(/[^a-z0-9-]/g, '');
  const patient = await medplum.createResourceIfNoneExist(
    {
      resourceType: 'Patient',
      meta: { tag: storyTags('speech-to-fhir') },
      identifier: [{ system: PATIENT_IDENTIFIER_SYSTEM, value: slug }],
      name: [{ given: [given], family }],
      birthDate,
    },
    `identifier=${PATIENT_IDENTIFIER_SYSTEM}|${slug}`
  );
  return { patient, created: true };
}

/**
 * Validates with the server's $validate, then creates (or reuses) the QuestionnaireResponse keyed by intake id.
 */
export async function writeIntake(medplum, { intakeId, channel, fields, triage, ticket }) {
  const { patient } = await findOrCreatePatient(medplum, fields['caller-name'], fields['birth-date']);
  const display = `${patient.name?.[0]?.given?.join(' ')} ${patient.name?.[0]?.family}`;
  const qr = toQuestionnaireResponse({
    intakeId,
    channel,
    fields,
    patient: { id: patient.id, display },
    triage,
    ticket,
  });
  const outcome = await medplum.validateResource(qr);
  const errors = (outcome.issue ?? []).filter((i) => i.severity === 'error' || i.severity === 'fatal');
  if (errors.length) {
    throw new Error(
      `QuestionnaireResponse failed $validate: ${errors.map((e) => e.details?.text ?? e.diagnostics).join('; ')}`
    );
  }
  const saved = await medplum.createResourceIfNoneExist(qr, `identifier=${INTAKE_IDENTIFIER_SYSTEM}|${intakeId}`);
  return { patient, questionnaireResponse: saved };
}
