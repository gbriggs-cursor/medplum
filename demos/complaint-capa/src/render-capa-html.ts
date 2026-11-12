// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { CapaRecord } from './open-capa';

export function renderCapaHtml(record: CapaRecord): string {
  const rows: [string, string][] = [
    ['CAPA id', record.capa_id],
    ['Complaint', record.complaint_id],
    ['Complaint ticket', record.complaint_ticket],
    ['Synthetic subject', record.synthetic_subject],
    ['Device', record.device],
    ['Event date', record.event_date],
    ['Displayed reading', record.displayed_reading],
    ['Comparison', record.comparison],
    ['Pairing failures', String(record.pairing_failure_count)],
    ['SOP section', record.sop_section],
    ['CAPA decision', record.capa],
    ['Reportability', record.reportability],
    ['Status', record.status],
    ['Submitted externally', String(record.submitted_externally)],
    ['Synthetic', String(record.synthetic)],
    ['HTEST', String(record.htest)],
    ['Source fixture', record.source_fixture],
  ];

  const body = rows
    .map(([label, value]) => `<div class="row"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`)
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(record.capa_id)} ${escapeHtml(record.complaint_id)}</title>
  <style>
    :root { color-scheme: light; }
    body { margin: 0; font: 16px/1.45 "Segoe UI", sans-serif; background: #f4f6f8; color: #1c2430; }
    main { max-width: 760px; margin: 32px auto; background: #fff; border: 1px solid #d5dde6; border-radius: 12px; overflow: hidden; }
    .banner { background: #7a4b00; color: #fff; padding: 12px 20px; }
    header { padding: 20px 20px 0; }
    h1 { margin: 0 0 8px; font-size: 28px; }
    .pills { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0 4px; }
    .pill { border-radius: 999px; padding: 4px 10px; background: #e7eef6; font-weight: 600; }
    .pill.open { background: #d9f2e3; }
    .pill.hold { background: #fff3d6; }
    section { padding: 8px 20px 20px; }
    h2 { margin: 16px 0 8px; font-size: 16px; }
    p { margin: 0 0 8px; }
    dl { margin: 0; }
    .row { display: grid; grid-template-columns: 180px 1fr; gap: 8px; padding: 6px 0; border-top: 1px solid #e6edf3; }
    dt { color: #526173; }
    dd { margin: 0; font-weight: 600; }
  </style>
</head>
<body>
  <main>
    <div class="banner">${escapeHtml(record.disclaimer)}</div>
    <header>
      <h1>${escapeHtml(record.capa_id)} for ${escapeHtml(record.complaint_id)}</h1>
      <div class="pills">
        <span class="pill open">capa: ${escapeHtml(record.capa)}</span>
        <span class="pill">reportability: ${escapeHtml(record.reportability)}</span>
        <span class="pill hold">status: ${escapeHtml(record.status)}</span>
        <span class="pill">submitted_externally: ${escapeHtml(String(record.submitted_externally))}</span>
      </div>
    </header>
    <section>
      <h2>CAPA rationale</h2>
      <p>${escapeHtml(record.capa_rationale)}</p>
      <h2>Reportability rationale</h2>
      <p>${escapeHtml(record.reportability_rationale)}</p>
      <h2>Complaint</h2>
      <p>${escapeHtml(record.event)}</p>
      <h2>Review</h2>
      <p>${escapeHtml(record.override)}</p>
      <dl>
        ${body}
      </dl>
    </section>
  </main>
</body>
</html>
`;
}

function escapeHtml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}
