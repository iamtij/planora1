/** Allowed bundle values — keep in sync with BookingModal options */
export const BUNDLE_PREFERENCE_IDS = [
  'tier_1_studio_condo',
  'tier_2_standard_home',
  'tier_3_executive_build',
] as const;

export type BundlePreferenceId = (typeof BUNDLE_PREFERENCE_IDS)[number];

export const ALLOWED_SLOT_INTERVALS = [15, 30, 60, 90, 120] as const;

/** Calendar day in Asia/Manila as YYYY-MM-DD (studio is in Quezon City). */
export function manilaTodayYmd(): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = fmt.formatToParts(new Date());
  const y = parts.find((p) => p.type === 'year')?.value;
  const m = parts.find((p) => p.type === 'month')?.value;
  const d = parts.find((p) => p.type === 'day')?.value;
  if (!y || !m || !d) return new Date().toISOString().slice(0, 10);
  return `${y}-${m}-${d}`;
}

/** Postgres TIME strings may be "HH:MM:SS" or "HH:MM"; normalizes to HH:MM */
export function normalizeTimeToHHMM(t: string): string {
  const s = t.trim();
  const m = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(s);
  if (!m) return s.length >= 5 ? s.slice(0, 5) : s;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

/** Display HH:MM (24h) as 12-hour clock (e.g. 9:05 AM, 2:30 PM). */
export function formatTime12Hour(hhmm: string): string {
  const n = normalizeTimeToHHMM(hhmm);
  const m = /^(\d{2}):(\d{2})$/.exec(n);
  if (!m) return hhmm;
  let h24 = parseInt(m[1], 10);
  const min = m[2];
  const period = h24 >= 12 ? 'PM' : 'AM';
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:${min} ${period}`;
}

/**
 * Slots from day_start inclusive to day_end exclusive (last slot starts before day_end).
 */
export function generateTimeSlots(dayStartHHMM: string, dayEndHHMM: string, intervalMinutes: number): string[] {
  const toMinutes = (hhmm: string) => {
    const [h, m] = hhmm.split(':').map((x) => parseInt(x, 10));
    if (Number.isNaN(h) || Number.isNaN(m)) return NaN;
    return h * 60 + m;
  };
  const fmt = (mins: number) => {
    const h = Math.floor(mins / 60) % 24;
    const m = mins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };
  let cur = toMinutes(dayStartHHMM);
  const end = toMinutes(dayEndHHMM);
  if (Number.isNaN(cur) || Number.isNaN(end) || end <= cur || intervalMinutes <= 0) {
    return [];
  }
  const slots: string[] = [];
  while (cur < end) {
    slots.push(fmt(cur));
    cur += intervalMinutes;
  }
  return slots;
}

export function isBundlePreferenceId(s: string): s is BundlePreferenceId {
  return (BUNDLE_PREFERENCE_IDS as readonly string[]).includes(s);
}
