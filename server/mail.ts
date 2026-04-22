import { formatTime12Hour } from './studioSettings.ts';

function envStr(key: string): string | undefined {
  const v = process.env[key];
  return typeof v === 'string' ? v.trim() : undefined;
}

export function publicAppUrl(): string {
  const u = envStr('PUBLIC_APP_URL') ?? 'http://localhost:3000';
  return u.replace(/\/$/, '');
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function bundleLabel(id: string | null): string {
  if (!id) return '—';
  if (id === 'tier_1_studio_condo') return 'Tier 1 — Studio/Condo';
  if (id === 'tier_2_standard_home') return 'Tier 2 — Standard Home';
  if (id === 'tier_3_executive_build') return 'Tier 3 — Executive Build';
  return id;
}

export type InquiryEmailFields = {
  id: number;
  name: string;
  email: string;
  mobile: string | null;
  type: string;
  inquiry: string;
  visit_date: string | null;
  visit_time: string | null;
  bundle_preference: string | null;
  prc_number: string | null;
};

/** Send via Resend (https://resend.com). Set RESEND_API_KEY; optional EMAIL_FROM. */
export async function sendTransactionalEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const apiKey = envStr('RESEND_API_KEY');
  if (!apiKey) {
    console.warn('[mail] RESEND_API_KEY not set — skipped:', opts.subject, '→', opts.to);
    return { ok: false, skipped: true, error: 'RESEND_API_KEY not configured' };
  }
  const from = envStr('EMAIL_FROM') ?? 'Planorama Bookings <onboarding@resend.dev>';
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
      }),
    });
    const raw = await res.text();
    if (!res.ok) {
      console.error('[mail] Resend error', res.status, raw);
      return { ok: false, error: raw || `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[mail] send failed:', msg);
    return { ok: false, error: msg };
  }
}

export async function notifyAdminNewInquiry(row: InquiryEmailFields): Promise<void> {
  const adminTo = envStr('ADMIN_NOTIFY_EMAIL');
  if (!adminTo) {
    console.warn('[mail] ADMIN_NOTIFY_EMAIL not set — admin will not receive new-booking email');
    return;
  }
  const reviewUrl = `${publicAppUrl()}/admin/inquiries?highlight=${row.id}`;
  const visitTime = row.visit_time ? formatTime12Hour(row.visit_time) : '—';
  const subject = `New studio booking request #${row.id} — ${row.name}`;
  const text = [
    `New Book Studio inquiry #${row.id}`,
    '',
    `Name: ${row.name}`,
    `Email: ${row.email}`,
    row.mobile ? `Mobile: ${row.mobile}` : '',
    `Project type: ${row.type}`,
    `Visit date: ${row.visit_date ?? '—'}`,
    `Visit time: ${visitTime}`,
    `Bundle: ${bundleLabel(row.bundle_preference)}`,
    row.prc_number ? `PRC #: ${row.prc_number}` : '',
    '',
    'Message:',
    row.inquiry,
    '',
    `Review in admin: ${reviewUrl}`,
  ]
    .filter(Boolean)
    .join('\n');

  const html = `
  <p style="font-family:system-ui,sans-serif;font-size:14px;line-height:1.5">
    <strong>New Book Studio inquiry #${row.id}</strong>
  </p>
  <table style="font-family:system-ui,sans-serif;font-size:14px;line-height:1.6;border-collapse:collapse">
    <tr><td style="padding:4px 12px 4px 0;color:#555">Name</td><td>${escapeHtml(row.name)}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#555">Email</td><td>${escapeHtml(row.email)}</td></tr>
    ${row.mobile ? `<tr><td style="padding:4px 12px 4px 0;color:#555">Mobile</td><td>${escapeHtml(row.mobile)}</td></tr>` : ''}
    <tr><td style="padding:4px 12px 4px 0;color:#555">Project type</td><td>${escapeHtml(row.type)}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#555">Visit date</td><td>${escapeHtml(row.visit_date ?? '—')}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#555">Visit time</td><td>${escapeHtml(visitTime)}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#555">Bundle</td><td>${escapeHtml(bundleLabel(row.bundle_preference))}</td></tr>
    ${row.prc_number ? `<tr><td style="padding:4px 12px 4px 0;color:#555">PRC #</td><td>${escapeHtml(row.prc_number)}</td></tr>` : ''}
  </table>
  <p style="font-family:system-ui,sans-serif;font-size:14px"><strong>Message</strong></p>
  <pre style="font-family:system-ui,monospace;font-size:13px;white-space:pre-wrap;background:#f5f5f5;padding:12px;border-radius:6px">${escapeHtml(row.inquiry)}</pre>
  <p style="font-family:system-ui,sans-serif;font-size:14px;margin-top:20px">
    <a href="${reviewUrl}" style="color:#111;font-weight:bold">Open admin — Approve or cancel</a>
  </p>
  `;

  const r = await sendTransactionalEmail({ to: adminTo, subject, html, text });
  if (!r.ok && !r.skipped) {
    console.error('[mail] admin notify failed:', r.error);
  }
}

export async function notifyUserInquiryReceived(row: InquiryEmailFields): Promise<void> {
  const visitTime = row.visit_time ? formatTime12Hour(row.visit_time) : '—';
  const subject = `We received your Planorama booking inquiry #${row.id}`;
  const text = [
    `Hi ${row.name},`,
    '',
    'Thank you for booking with Planorama.',
    'We have received your inquiry and it is currently under review.',
    'We will get back to you shortly after we confirm schedule availability.',
    '',
    'Your submitted details:',
    `Date: ${row.visit_date ?? '—'}`,
    `Time: ${visitTime}`,
    `Project type: ${row.type}`,
    `Bundle: ${bundleLabel(row.bundle_preference)}`,
    '',
    'If you need to update your request, reply to this email.',
    '',
    '— Planorama',
  ].join('\n');

  const html = `
  <p style="font-family:system-ui,sans-serif;font-size:15px">Hi ${escapeHtml(row.name)},</p>
  <p style="font-family:system-ui,sans-serif;font-size:14px;line-height:1.6">
    Thank you for booking with Planorama.
  </p>
  <p style="font-family:system-ui,sans-serif;font-size:14px;line-height:1.6">
    We have <strong>received your inquiry</strong> and it is currently <strong>under review</strong>.<br/>
    We will get back to you shortly after we confirm schedule availability.
  </p>
  <table style="font-family:system-ui,sans-serif;font-size:14px;line-height:1.6;border-collapse:collapse;margin:16px 0">
    <tr><td style="padding:4px 12px 4px 0;color:#555">Date</td><td><strong>${escapeHtml(row.visit_date ?? '—')}</strong></td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#555">Time</td><td><strong>${escapeHtml(visitTime)}</strong></td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#555">Project type</td><td>${escapeHtml(row.type)}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#555">Bundle</td><td>${escapeHtml(bundleLabel(row.bundle_preference))}</td></tr>
  </table>
  <p style="font-family:system-ui,sans-serif;font-size:13px;color:#555">
    If you need to update your request, reply to this email.
  </p>
  <p style="font-family:system-ui,sans-serif;font-size:13px;margin-top:20px;color:#666">— Planorama</p>
  `;

  const r = await sendTransactionalEmail({ to: row.email, subject, html, text });
  if (!r.ok && !r.skipped) {
    console.error('[mail] user inquiry receipt failed:', r.error);
  }
}

export async function notifyUserBookingApproved(row: InquiryEmailFields): Promise<void> {
  const visitTime = row.visit_time ? formatTime12Hour(row.visit_time) : '—';
  const subject = `Your Planorama studio visit is confirmed — ${row.visit_date ?? ''}`;
  const text = [
    `Hi ${row.name},`,
    '',
    'Your studio visit is confirmed. Details:',
    '',
    `Date: ${row.visit_date ?? '—'}`,
    `Time: ${visitTime}`,
    `Project type: ${row.type}`,
    `Bundle: ${bundleLabel(row.bundle_preference)}`,
    '',
    'What you shared with us:',
    row.inquiry,
    '',
    'We look forward to seeing you at:',
    '10 Don Alfredo Egea, Quezon City',
    '',
    '— Planorama',
  ].join('\n');

  const html = `
  <p style="font-family:system-ui,sans-serif;font-size:15px">Hi ${escapeHtml(row.name)},</p>
  <p style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.5"><strong>Your studio visit is confirmed.</strong></p>
  <table style="font-family:system-ui,sans-serif;font-size:14px;line-height:1.6;border-collapse:collapse;margin:16px 0">
    <tr><td style="padding:4px 12px 4px 0;color:#555">Date</td><td><strong>${escapeHtml(row.visit_date ?? '—')}</strong></td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#555">Time</td><td><strong>${escapeHtml(visitTime)}</strong></td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#555">Project type</td><td>${escapeHtml(row.type)}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#555">Bundle</td><td>${escapeHtml(bundleLabel(row.bundle_preference))}</td></tr>
  </table>
  <p style="font-family:system-ui,sans-serif;font-size:13px;color:#444"><strong>Location</strong><br/>10 Don Alfredo Egea, Quezon City</p>
  <p style="font-family:system-ui,sans-serif;font-size:13px;margin-top:16px;color:#555">Your message to us:</p>
  <pre style="font-family:system-ui,monospace;font-size:13px;white-space:pre-wrap;background:#f5f5f5;padding:12px;border-radius:6px">${escapeHtml(row.inquiry)}</pre>
  <p style="font-family:system-ui,sans-serif;font-size:13px;margin-top:24px;color:#666">— Planorama</p>
  `;

  const r = await sendTransactionalEmail({ to: row.email, subject, html, text });
  if (!r.ok && !r.skipped) {
    console.error('[mail] user confirmation failed:', r.error);
  }
}

export async function notifyUserBookingCancelled(row: InquiryEmailFields): Promise<void> {
  const visitTime = row.visit_time ? formatTime12Hour(row.visit_time) : '—';
  const subject = `Update on your Planorama studio visit request`;
  const text = [
    `Hi ${row.name},`,
    '',
    'Thank you for your interest in visiting Planorama.',
    '',
    `We are not able to confirm the following requested slot at this time:`,
    `Date: ${row.visit_date ?? '—'}`,
    `Time: ${visitTime}`,
    '',
    'If you have questions or would like to explore other options, reply to this email or contact the studio.',
    '',
    '— Planorama',
  ].join('\n');

  const html = `
  <p style="font-family:system-ui,sans-serif;font-size:15px">Hi ${escapeHtml(row.name)},</p>
  <p style="font-family:system-ui,sans-serif;font-size:14px;line-height:1.6">Thank you for your interest in visiting Planorama.</p>
  <p style="font-family:system-ui,sans-serif;font-size:14px;line-height:1.6">We are <strong>not able to confirm</strong> the following requested slot at this time:</p>
  <ul style="font-family:system-ui,sans-serif;font-size:14px">
    <li>Date: <strong>${escapeHtml(row.visit_date ?? '—')}</strong></li>
    <li>Time: <strong>${escapeHtml(visitTime)}</strong></li>
  </ul>
  <p style="font-family:system-ui,sans-serif;font-size:13px;color:#555">If you have questions, reply to this email or contact the studio.</p>
  <p style="font-family:system-ui,sans-serif;font-size:13px;margin-top:20px;color:#666">— Planorama</p>
  `;

  const r = await sendTransactionalEmail({ to: row.email, subject, html, text });
  if (!r.ok && !r.skipped) {
    console.error('[mail] user cancellation notice failed:', r.error);
  }
}
