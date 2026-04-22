/**
 * Send a one-off test via Resend (same transport as server/mail.ts).
 *
 * Usage:
 *   npm run mail:test
 *     → sends to ADMIN_NOTIFY_EMAIL from .env, or ttalusan@icloud.com
 *   npm run mail:test -- you@example.com
 *   npm run mail:test -- --both
 *     → sends to ttalusan@icloud.com and tjtalusan@gmail.com (edit addresses in this file if needed)
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(root, '.env') });

const key = process.env.RESEND_API_KEY?.trim();
const from = process.env.EMAIL_FROM?.trim() || 'Planorama <onboarding@resend.dev>';
const replyTo =
  process.env.EMAIL_REPLY_TO?.trim() || 'planoramastudiosph@gmail.com';

const argv = process.argv.slice(2).filter((a) => a !== '--');

/** Default “both test inboxes” — change if you use different test addresses */
const DEFAULT_BOTH = ['ttalusan@icloud.com', 'tjtalusan@gmail.com'];

function usageAndExit(code) {
  console.error(`
Resend is not configured (missing RESEND_API_KEY in .env).

Steps:
  1. Sign up: https://resend.com/
  2. API key: https://resend.com/api-keys
  3. In .env set: RESEND_API_KEY=re_...

Note: With sender onboarding@resend.dev, Resend may only deliver to addresses
allowed on your plan (often your Resend account email) until you verify a domain.
After domain verification, set EMAIL_FROM to an address on that domain.

Then run:
  npm run mail:test
  npm run mail:test -- your@email.com
  npm run mail:test -- --both
`);
  process.exit(code);
}

if (!key) {
  usageAndExit(1);
}

let recipients = [];
if (argv.includes('--both')) {
  recipients = [...DEFAULT_BOTH];
} else if (argv.length > 0 && argv[0] !== '--both') {
  recipients = [argv[0]];
} else {
  const admin = process.env.ADMIN_NOTIFY_EMAIL?.trim();
  recipients = [admin || DEFAULT_BOTH[0]];
}

async function sendOne(to) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      reply_to: replyTo,
      to: [to],
      subject: `[Planorama mail:test] ${new Date().toISOString()}`,
      html: `<p>This is a manual test from <code>npm run mail:test</code>.</p><p><strong>To:</strong> ${escapeHtml(to)}</p><p>If you received this, Resend delivery works.</p>`,
      text: `Planorama mail:test to ${to}. If you received this, Resend works.`,
    }),
  });
  const raw = await res.text();
  if (!res.ok) {
    console.error(`\n✗ ${to} — HTTP ${res.status}`);
    console.error(raw);
    return false;
  }
  console.log(`\n✓ Sent to ${to}`);
  console.log(raw);
  return true;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

let ok = 0;
for (const to of recipients) {
  if (await sendOne(to)) ok += 1;
}

console.log(`\nDone: ${ok}/${recipients.length} accepted by Resend.`);
process.exit(ok === recipients.length ? 0 : 1);
