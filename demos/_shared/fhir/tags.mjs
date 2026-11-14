// Same synthetic tags as the P1 device cohort, so one search finds every demo resource.
export const SYNTHETIC_TAGS = [
  { system: 'https://medplum.com/fhir/CodeSystem/synthetic', code: 'synthetic', display: 'Synthetic demo data' },
  { system: 'http://terminology.hl7.org/CodeSystem/v3-ActReason', code: 'HTEST', display: 'test health data' },
];

export const STORY_TAG_SYSTEM = 'https://medplum.com/fhir/CodeSystem/demo-story';

export function storyTags(story) {
  return [...SYNTHETIC_TAGS, { system: STORY_TAG_SYSTEM, code: story }];
}

export function isSynthetic(resource) {
  const tags = resource?.meta?.tag ?? [];
  return SYNTHETIC_TAGS.every((t) => tags.some((x) => x.system === t.system && x.code === t.code));
}
