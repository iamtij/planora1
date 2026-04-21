import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { formatTime12Hour } from '@/server/studioSettings';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PROJECT_TYPES = [
  'RESIDENTIAL ARCHITECTURE',
  'COMMERCIAL SPACE',
  'INTERIOR DESIGN',
  'PHOTOSHOOT',
  'EVENT',
  'OTHERS',
] as const;

/** Values must match server `BUNDLE_PREFERENCE_IDS` */
type BundleOption = {
  id: string;
  label: string;
  title: string;
  bullets: string[];
  priceLabel: string;
};

const BUNDLE_OPTIONS: BundleOption[] = [
  {
    id: 'tier_1_studio_condo',
    label: 'Tier 1 — Studio/Condo (100 sqm and below)',
    title: 'Tier 1: Studio/Condo',
    bullets: ['100 sqm and below', '1 hour use of walkthrough & meeting room'],
    priceLabel: 'PHP 9,000.00',
  },
  {
    id: 'tier_2_standard_home',
    label: 'Tier 2 — Standard Home (200 sqm and below)',
    title: 'Tier 2: Standard Home',
    bullets: ['200 sqm and below', '1.5 hours use of walkthrough & meeting room'],
    priceLabel: 'PHP 14,000.00',
  },
  {
    id: 'tier_3_executive_build',
    label: 'Tier 3 — Executive Build (200 sqm and above)',
    title: 'Tier 3: Executive Build',
    bullets: ['200 sqm and above', '2 hours use of walkthrough & meeting room'],
    priceLabel: 'PHP 18,000.00',
  },
];

function formatVisitDateOption(ymd: string): string {
  const p = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!p) return ymd;
  const dt = new Date(Number(p[1]), Number(p[2]) - 1, Number(p[3]));
  return dt.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [isClosing, setIsClosing] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [type, setType] = useState<string>(PROJECT_TYPES[0]);
  const [visitDate, setVisitDate] = useState('');
  const [visitTime, setVisitTime] = useState('');
  const [bundlePreference, setBundlePreference] = useState(BUNDLE_OPTIONS[0].id);
  const [prcNumber, setPrcNumber] = useState('');
  const [inquiry, setInquiry] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [slots, setSlots] = useState<string[]>([]);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [datesLoading, setDatesLoading] = useState(false);
  const [datesError, setDatesError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep('form');
      setIsClosing(false);
      setName('');
      setEmail('');
      setMobile('');
      setType(PROJECT_TYPES[0]);
      setVisitDate('');
      setVisitTime('');
      setBundlePreference(BUNDLE_OPTIONS[0].id);
      setPrcNumber('');
      setInquiry('');
      setSubmitting(false);
      setError(null);
      setSettingsError(null);
      setSlots([]);
      setAvailableDates([]);
      setDatesError(null);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  /** Load dates that have at least one bookable slot (native date input cannot disable individual days). */
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setDatesLoading(true);
    setDatesError(null);
    void fetch('/api/studio/available-dates')
      .then(async (res) => {
        const data = (await res.json().catch(() => ({}))) as { dates?: string[]; error?: string };
        if (!res.ok) {
          throw new Error(typeof data.error === 'string' ? data.error : 'Could not load available dates');
        }
        if (!Array.isArray(data.dates)) {
          throw new Error('Invalid dates response');
        }
        if (!cancelled) setAvailableDates(data.dates);
      })
      .catch(() => {
        if (!cancelled) {
          setDatesError('Could not load open days. Check your connection or try again.');
          setAvailableDates([]);
        }
      })
      .finally(() => {
        if (!cancelled) setDatesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    if (datesLoading || !visitDate) return;
    if (availableDates.length > 0 && !availableDates.includes(visitDate)) {
      setVisitDate('');
      setVisitTime('');
    }
  }, [availableDates, visitDate, datesLoading]);

  /** Load time slots for the chosen date (admin-configured per day). */
  useEffect(() => {
    if (!isOpen || !visitDate) {
      setSlots([]);
      setSettingsLoading(false);
      setSettingsError(null);
      return;
    }
    let cancelled = false;
    setSettingsLoading(true);
    setSettingsError(null);
    void fetch(`/api/studio/settings?date=${encodeURIComponent(visitDate)}`)
      .then(async (res) => {
        const data = (await res.json().catch(() => ({}))) as { slots?: string[]; error?: string };
        if (!res.ok) {
          throw new Error(typeof data.error === 'string' ? data.error : 'Could not load schedule');
        }
        if (!Array.isArray(data.slots)) {
          throw new Error('Invalid schedule response');
        }
        if (!cancelled) {
          setSlots(data.slots);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSettingsError('Could not load visit times. Check your connection or try again.');
          setSlots([]);
        }
      })
      .finally(() => {
        if (!cancelled) setSettingsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, visitDate]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 400);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!visitDate || !visitTime) {
      setError('Please choose a date and time for your visit.');
      return;
    }
    if (datesLoading || datesError || availableDates.length === 0 || !availableDates.includes(visitDate)) {
      setError(
        datesError ?? (availableDates.length === 0 ? 'No open visit days right now — contact the studio.' : 'Please choose a valid visit date.')
      );
      return;
    }
    if (settingsLoading || settingsError || slots.length === 0) {
      setError(
        settingsError ??
          (slots.length === 0 ? 'No open slots on this date — pick another day or contact the studio.' : 'Visit times are not available.')
      );
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          mobile: mobile.trim() || undefined,
          type,
          inquiry,
          visitDate,
          visitTime,
          bundlePreference,
          prcNumber: prcNumber.trim() || undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Something went wrong. Try again.');
        return;
      }
      setStep('success');
    } catch {
      setError('Could not reach the server. Is the API running?');
    } finally {
      setSubmitting(false);
    }
  };

  const scheduleBlocked =
    datesLoading ||
    !!datesError ||
    availableDates.length === 0 ||
    !visitDate ||
    settingsLoading ||
    !!settingsError ||
    (visitDate !== '' && !settingsLoading && slots.length === 0);

  const selectedBundle = BUNDLE_OPTIONS.find((b) => b.id === bundlePreference) ?? BUNDLE_OPTIONS[0];

  if (!isOpen && !isClosing) return null;

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-500 ${isOpen && !isClosing ? 'opacity-100' : 'opacity-0'}`}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClose}></div>

      <div className={`bg-white w-full max-w-xl relative transition-all duration-500 transform ${isOpen && !isClosing ? 'scale-100 translate-y-0' : 'scale-95 translate-y-12'} max-h-[90vh] overflow-y-auto`}>
        
        <div className="p-6 sm:p-10">
          <button onClick={handleClose} className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 hover:text-bauhaus-red transition-colors" aria-label="Close">
            <X size={24} />
          </button>

          {step === 'form' ? (
            <div className="pt-4">
              <h3 className="text-3xl font-black uppercase tracking-bauhaus mb-2 text-bauhaus-red">BOOK STUDIO</h3>
              <p className="text-gray-500 text-sm mb-6 font-medium tracking-wide uppercase">EXPERIENCE YOUR PROJECT AT LIFE SIZE.</p>
              <p className="text-[10px] font-bold uppercase tracking-architect opacity-40 mb-2">STUDIO LOCATION</p>
              <p className="text-sm font-bold uppercase tracking-bauhaus text-black leading-snug mb-10 border-l-2 border-black pl-4">
                10 DON ALFREDO EGEA,
                <br />
                QUEZON CITY
              </p>

              <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-architect opacity-40">
                      NAME <span className="text-bauhaus-red" aria-hidden="true">*</span>
                    </label>
                    <input
                      required
                      autoComplete="name"
                      type="text"
                      value={name}
                      onChange={(ev) => setName(ev.target.value)}
                      className="w-full border-b-2 border-black py-3 focus:border-bauhaus-red outline-none font-bold uppercase text-sm transition-all"
                      placeholder="YOUR NAME"
                      aria-required="true"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-architect opacity-40">
                      EMAIL <span className="text-bauhaus-red" aria-hidden="true">*</span>
                    </label>
                    <input
                      required
                      autoComplete="email"
                      type="email"
                      value={email}
                      onChange={(ev) => setEmail(ev.target.value)}
                      className="w-full border-b-2 border-black py-3 focus:border-bauhaus-blue outline-none font-bold uppercase text-sm transition-all"
                      placeholder="EMAIL@DOMAIN.COM"
                      aria-required="true"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-architect opacity-40">
                    MOBILE <span className="text-black/30 font-normal normal-case">(optional)</span>
                  </label>
                  <input
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    value={mobile}
                    onChange={(ev) => setMobile(ev.target.value)}
                    className="w-full border-b-2 border-black py-3 focus:border-bauhaus-yellow outline-none font-bold uppercase text-sm transition-all"
                    placeholder="+63 … OR LOCAL NUMBER"
                    maxLength={40}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-architect opacity-40">PROJECT TYPE</label>
                  <select
                    value={type}
                    onChange={(ev) => setType(ev.target.value)}
                    className="w-full border-b-2 border-black py-3 focus:border-bauhaus-yellow outline-none font-bold uppercase text-sm cursor-pointer appearance-none bg-transparent"
                  >
                    {PROJECT_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-architect opacity-40">
                      DATE OF VISIT <span className="text-bauhaus-red" aria-hidden="true">*</span>
                    </label>
                    <select
                      required
                      value={visitDate}
                      onChange={(ev) => {
                        setVisitDate(ev.target.value);
                        setVisitTime('');
                      }}
                      disabled={datesLoading || !!datesError || availableDates.length === 0}
                      className="w-full border-b-2 border-black py-3 focus:border-bauhaus-red outline-none font-bold uppercase text-sm cursor-pointer appearance-none bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">
                        {datesLoading
                          ? 'Loading open days…'
                          : datesError
                            ? 'Unavailable'
                            : availableDates.length === 0
                              ? 'No open days yet'
                              : 'Select a date'}
                      </option>
                      {availableDates.map((d) => (
                        <option key={d} value={d}>
                          {formatVisitDateOption(d)}
                        </option>
                      ))}
                    </select>
                    {datesError ? (
                      <p className="text-bauhaus-red text-[10px] font-bold uppercase tracking-architect" role="alert">
                        {datesError}
                      </p>
                    ) : null}
                    {!datesLoading && !datesError && availableDates.length === 0 ? (
                      <p className="text-[10px] font-medium text-black/55 leading-snug">
                        The studio hasn&apos;t published visit days yet. Please check back or contact us.
                      </p>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-architect opacity-40">
                      TIME OF VISIT <span className="text-bauhaus-red" aria-hidden="true">*</span>
                    </label>
                    <select
                      required
                      value={visitTime}
                      onChange={(ev) => setVisitTime(ev.target.value)}
                      disabled={scheduleBlocked}
                      className="w-full border-b-2 border-black py-3 focus:border-bauhaus-blue outline-none font-bold normal-case text-sm cursor-pointer appearance-none bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">
                        {!visitDate
                          ? 'Select a date first…'
                          : settingsLoading
                            ? 'Loading times…'
                            : settingsError
                              ? 'Unavailable'
                              : slots.length === 0
                                ? 'No slots this day'
                                : 'Select a time'}
                      </option>
                      {slots.map((s) => (
                        <option key={s} value={s}>
                          {formatTime12Hour(s)}
                        </option>
                      ))}
                    </select>
                    {visitDate && settingsLoading ? (
                      <p className="text-[10px] font-mono text-black/40">Loading schedule…</p>
                    ) : null}
                    {visitDate && settingsError ? (
                      <p className="text-bauhaus-red text-[10px] font-bold uppercase tracking-architect" role="alert">
                        {settingsError}
                      </p>
                    ) : null}
                    {visitDate && !settingsLoading && !settingsError && slots.length === 0 ? (
                      <p className="text-[10px] font-medium text-black/55 leading-snug">
                        No open slots on this date. Choose another day or contact the studio.
                      </p>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-architect opacity-40">
                      BUNDLE PREFERENCE <span className="text-bauhaus-red" aria-hidden="true">*</span>
                    </label>
                    <select
                      required
                      value={bundlePreference}
                      onChange={(ev) => setBundlePreference(ev.target.value)}
                      className="w-full border-b-2 border-black py-3 focus:border-bauhaus-yellow outline-none font-bold text-xs cursor-pointer appearance-none bg-transparent leading-snug"
                    >
                      {BUNDLE_OPTIONS.map((b) => (
                        <option key={b.id} value={b.id}>{b.label}</option>
                      ))}
                    </select>
                    <div className="mt-3 border border-black/15 bg-bauhaus-beige/60 p-3">
                      <p className="text-[10px] font-black uppercase tracking-architect text-black/70">{selectedBundle.title}</p>
                      <ul className="mt-2 list-disc pl-5 text-xs text-black/80 leading-snug space-y-1">
                        {selectedBundle.bullets.map((t) => (
                          <li key={t}>{t}</li>
                        ))}
                        <li>
                          <span className="font-bold">Price:</span> {selectedBundle.priceLabel}
                        </li>
                      </ul>
                      <div className="mt-3 border-t border-black/10 pt-3">
                        <p className="text-[10px] font-black uppercase tracking-architect text-black/70">Meeting Room (Add-on)</p>
                        <ul className="mt-2 list-disc pl-5 text-xs text-black/70 leading-snug space-y-1">
                          <li>PHP 1,000 – 1,500 per hour</li>
                          <li>With WiFi use</li>
                          <li>Subject to availability</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-architect opacity-40">
                      PRC # <span className="text-black/30 font-normal normal-case">(if applicable)</span>
                    </label>
                    <input
                      type="text"
                      value={prcNumber}
                      onChange={(ev) => setPrcNumber(ev.target.value)}
                      className="w-full border-b-2 border-black py-3 focus:border-bauhaus-yellow outline-none font-bold uppercase text-sm transition-all"
                      placeholder="LICENSE NUMBER"
                      maxLength={80}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-architect opacity-40">
                    INQUIRY <span className="text-bauhaus-red" aria-hidden="true">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={inquiry}
                    onChange={(ev) => setInquiry(ev.target.value)}
                    className="w-full border-2 border-black p-3 focus:border-bauhaus-red outline-none font-medium text-sm transition-all resize-y min-h-[100px] placeholder:text-gray-400 placeholder:font-normal"
                    placeholder="Briefly describe your project, goals, and any questions for your studio session."
                  />
                </div>

                {error ? (
                  <p className="text-bauhaus-red text-xs font-bold uppercase tracking-architect" role="alert">
                    {error}
                  </p>
                ) : null}

                <div className="pt-2 sm:pt-4">
                  <button
                    type="submit"
                    disabled={submitting || scheduleBlocked}
                    className="w-full bg-black text-white py-6 font-bold uppercase tracking-architect text-xs hover:bg-bauhaus-red active:scale-[0.98] transition-all disabled:opacity-60 disabled:pointer-events-none"
                  >
                    {submitting ? 'SENDING…' : 'SUBMIT REQUEST'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12">
              <div className="w-16 h-16 bg-bauhaus-yellow flex items-center justify-center mx-auto mb-8">
                <Check className="text-black w-8 h-8" />
              </div>
              <h4 className="text-4xl font-black tracking-bauhaus mb-4">Received!</h4>
              <p className="text-gray-500 font-medium mb-12 text-sm sm:text-base leading-relaxed max-w-md mx-auto">
                We&apos;ve got it! We&apos;ll reach out shortly to finalize your booking.
              </p>
              <button onClick={handleClose} className="text-black font-bold uppercase text-[10px] tracking-architect border-b border-black pb-1 hover:text-bauhaus-red hover:border-bauhaus-red p-2">CLOSE WINDOW</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
