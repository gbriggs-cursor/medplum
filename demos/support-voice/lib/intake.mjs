import { createHmac, randomBytes, randomUUID } from 'node:crypto';

// Server-enforced two-phase confirm: a draft is read back to the caller, and nothing is written until the caller
// confirms that exact draft. The confirm token binds the draft content, so an edited draft needs a new read-back.

const FIELDS = ['caller_name', 'dob', 'callback', 'product', 'issue', 'channel', 'transcript'];
const REQUIRED = ['caller_name', 'dob', 'issue'];
const TTL_MS = 15 * 60 * 1000;

export class IntakeError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

export function createIntakeStore({ secret = randomBytes(32), now = () => Date.now() } = {}) {
  const drafts = new Map();
  const sign = (id, draft) =>
    createHmac('sha256', secret).update(id).update(JSON.stringify(draft)).digest('hex').slice(0, 32);

  return {
    draft(input) {
      const draft = {};
      for (const f of FIELDS) {
        if (input[f] !== undefined && input[f] !== null && String(input[f]).trim()) {
          draft[f] = String(input[f]).trim();
        }
      }
      draft.channel = draft.channel === 'voice' ? 'voice' : 'form';
      const missing = REQUIRED.filter((f) => !draft[f]);
      if (missing.length) {
        throw new IntakeError('missing_fields', `Missing required field(s): ${missing.join(', ')}`);
      }
      const id = `INTAKE-${randomUUID().slice(0, 8)}`;
      drafts.set(id, { draft, created: now(), state: 'awaiting_confirm' });
      return { id, confirmToken: sign(id, draft), readback: readback(draft), state: 'awaiting_confirm' };
    },

    confirm(id, token, { confirmed } = {}) {
      const entry = drafts.get(id);
      if (!entry) {
        throw new IntakeError('not_found', `No draft ${id}`);
      }
      if (now() - entry.created > TTL_MS) {
        drafts.delete(id);
        throw new IntakeError('expired', `Draft ${id} expired; read it back again`);
      }
      if (entry.state !== 'awaiting_confirm') {
        throw new IntakeError('already_submitted', `Draft ${id} was already ${entry.state}`);
      }
      if (token !== sign(id, entry.draft)) {
        throw new IntakeError('token_mismatch', 'Confirm token does not match the draft that was read back');
      }
      if (confirmed !== true) {
        entry.state = 'declined';
        return { id, state: 'declined' };
      }
      entry.state = 'confirmed';
      return { id, state: 'confirmed', intake: { ...entry.draft } };
    },
  };
}

export function readback(draft) {
  const product = draft.product ? ` about ${draft.product}` : '';
  return `Let me read that back. You are ${draft.caller_name}, born ${draft.dob}, calling${product}. The issue: ${draft.issue}. Is that right?`;
}
