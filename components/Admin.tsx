import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  LogOut,
  MessageSquare,
  Pencil,
  Phone,
  Trash2,
} from 'lucide-react';
import { formatTime12Hour } from '@/server/studioSettings';

const TOKEN_KEY = 'planorama_admin_token';

export type InquiryRow = {
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
  created_at: string;
};

const BUNDLE_LABELS: Record<string, string> = {
  tier_1_studio_condo: 'Tier 1 — Studio/Condo',
  tier_2_standard_home: 'Tier 2 — Standard Home',
  tier_3_executive_build: 'Tier 3 — Executive Build',
};

function formatBundleLabel(id: string | null): string {
  if (!id) return '—';
  return BUNDLE_LABELS[id] ?? id;
}

function displayVisitTime(t: string | null | undefined): string {
  if (t == null || t === '') return '—';
  return formatTime12Hour(t);
}

type BookableSlotRow = { id: number; slot_date: string; slot_time: string };

function todayYmdLocal(): string {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
}

/** Month grid: Sunday-first columns; null = empty pad cell. */
function buildCalendarCells(year: number, monthIndex: number): (null | { ymd: string; day: number })[] {
  const first = new Date(year, monthIndex, 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells: (null | { ymd: string; day: number })[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const ymd = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ ymd, day: d });
  }
  const totalCells = Math.ceil(cells.length / 7) * 7;
  while (cells.length < totalCells) cells.push(null);
  return cells;
}

function formatSlotDateHeading(ymd: string): string {
  const p = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!p) return ymd;
  const y = parseInt(p[1], 10);
  const m = parseInt(p[2], 10) - 1;
  const d = parseInt(p[3], 10);
  const dt = new Date(y, m, d);
  return dt.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

type SortKey = keyof InquiryRow;
type SortDir = 'asc' | 'desc';

const PAGE_SIZE = 20;

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

/** Build tel: / sms: href from stored mobile string */
function phoneDialHref(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const s = raw.trim();
  const digits = s.replace(/\D/g, '');
  if (!digits) return null;
  const num = s.startsWith('+') ? `+${digits}` : digits;
  return num;
}

const EmailLink: React.FC<{ email: string }> = ({ email }) => {
  const trimmed = email.trim();
  return (
    <a
      href={`mailto:${encodeURIComponent(trimmed)}`}
      className="text-bauhaus-blue underline decoration-bauhaus-blue/30 underline-offset-2 hover:decoration-bauhaus-blue"
    >
      {email}
    </a>
  );
};

const MobileLinkBar: React.FC<{ mobile: string | null }> = ({ mobile }) => {
  const num = phoneDialHref(mobile);
  if (!num) {
    return <span className="text-black/40">—</span>;
  }
  const iconBtn =
    'inline-flex h-10 w-10 items-center justify-center rounded-sm border border-black/20 text-black transition-colors hover:border-black hover:bg-black hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bauhaus-blue';
  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-mono text-xs break-words">{mobile}</span>
      <div className="flex flex-wrap items-center gap-2">
        <a href={`tel:${num}`} className={iconBtn} aria-label="Call">
          <Phone className="h-4 w-4" strokeWidth={2} aria-hidden />
        </a>
        <a href={`sms:${num}`} className={iconBtn} aria-label="Send SMS">
          <MessageSquare className="h-4 w-4" strokeWidth={2} aria-hidden />
        </a>
      </div>
    </div>
  );
};

function adminTabClass({ isActive }: { isActive: boolean }): string {
  return [
    'inline-flex items-center px-4 py-2.5 text-[10px] font-bold uppercase tracking-architect border-2 transition-colors whitespace-nowrap',
    isActive ? 'border-black bg-black text-white' : 'border-black/20 bg-white text-black hover:border-black/50',
  ].join(' ');
}

const Admin: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem(TOKEN_KEY));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  const [rows, setRows] = useState<InquiryRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);

  const [dayStart, setDayStart] = useState('09:00');
  const [dayEnd, setDayEnd] = useState('18:00');
  const [slotInterval, setSlotInterval] = useState(30);
  const [studioLoading, setStudioLoading] = useState(false);
  const [studioSaving, setStudioSaving] = useState(false);
  const [studioMsg, setStudioMsg] = useState<string | null>(null);
  const [studioErr, setStudioErr] = useState<string | null>(null);

  const [bookableSlots, setBookableSlots] = useState<BookableSlotRow[]>([]);
  const [bookableLoading, setBookableLoading] = useState(false);
  const [bookableErr, setBookableErr] = useState<string | null>(null);
  const [newSlotDate, setNewSlotDate] = useState('');
  const [newSlotTime, setNewSlotTime] = useState('');
  const [fillTemplateDate, setFillTemplateDate] = useState('');
  const [fillBusy, setFillBusy] = useState(false);
  const [addSlotBusy, setAddSlotBusy] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editSlotDate, setEditSlotDate] = useState('');
  const [editSlotTime, setEditSlotTime] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());

  const fetchInquiries = useCallback(async (t: string) => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch('/api/admin/inquiries', {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.status === 401) {
        sessionStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setLoadError('Session expired. Sign in again.');
        return;
      }
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setLoadError(data.error ?? 'Could not load inquiries');
        return;
      }
      const data = (await res.json()) as InquiryRow[];
      setRows(data);
    } catch {
      setLoadError('Could not reach the server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      void fetchInquiries(token);
    } else {
      setRows([]);
    }
  }, [token, fetchInquiries]);

  const fetchStudioSettings = useCallback(async (t: string) => {
    setStudioLoading(true);
    setStudioErr(null);
    try {
      const res = await fetch('/api/admin/studio-settings', {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.status === 401) {
        sessionStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setStudioErr('Session expired. Sign in again.');
        return;
      }
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setStudioErr(data.error ?? 'Could not load studio settings');
        return;
      }
      const data = (await res.json()) as { dayStart: string; dayEnd: string; slotIntervalMinutes: number };
      setDayStart(data.dayStart);
      setDayEnd(data.dayEnd);
      setSlotInterval(data.slotIntervalMinutes);
    } catch {
      setStudioErr('Could not reach the server.');
    } finally {
      setStudioLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      void fetchStudioSettings(token);
    }
  }, [token, fetchStudioSettings]);

  const fetchBookableSlots = useCallback(async (t: string) => {
    setBookableLoading(true);
    setBookableErr(null);
    try {
      const res = await fetch('/api/admin/bookable-slots', {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.status === 401) {
        sessionStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setBookableErr('Session expired. Sign in again.');
        return;
      }
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setBookableErr(data.error ?? 'Could not load bookable slots');
        return;
      }
      const data = (await res.json()) as BookableSlotRow[];
      setBookableSlots(data);
    } catch {
      setBookableErr('Could not reach the server.');
    } finally {
      setBookableLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      void fetchBookableSlots(token);
    } else {
      setBookableSlots([]);
    }
  }, [token, fetchBookableSlots]);

  const handleAddBookableSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newSlotDate.trim() || !newSlotTime.trim()) return;
    setAddSlotBusy(true);
    setBookableErr(null);
    try {
      const res = await fetch('/api/admin/bookable-slots', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ slotDate: newSlotDate.trim(), slotTime: newSlotTime.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.status === 401) {
        sessionStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setBookableErr('Session expired.');
        return;
      }
      if (!res.ok) {
        setBookableErr(data.error ?? 'Could not add slot');
        return;
      }
      setNewSlotTime('');
      await fetchBookableSlots(token);
    } catch {
      setBookableErr('Could not reach the server.');
    } finally {
      setAddSlotBusy(false);
    }
  };

  const handleFillDayFromTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !fillTemplateDate.trim()) return;
    setFillBusy(true);
    setBookableErr(null);
    try {
      const res = await fetch('/api/admin/bookable-slots/fill-from-template', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ slotDate: fillTemplateDate.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; inserted?: number };
      if (res.status === 401) {
        sessionStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setBookableErr('Session expired.');
        return;
      }
      if (!res.ok) {
        setBookableErr(data.error ?? 'Could not fill slots');
        return;
      }
      await fetchBookableSlots(token);
    } catch {
      setBookableErr('Could not reach the server.');
    } finally {
      setFillBusy(false);
    }
  };

  const handleDeleteBookableSlot = async (id: number) => {
    if (!token) return;
    setBookableErr(null);
    if (editingId === id) {
      setEditingId(null);
    }
    try {
      const res = await fetch(`/api/admin/bookable-slots/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        sessionStorage.removeItem(TOKEN_KEY);
        setToken(null);
        return;
      }
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setBookableErr(data.error ?? 'Could not remove slot');
        return;
      }
      await fetchBookableSlots(token);
    } catch {
      setBookableErr('Could not reach the server.');
    }
  };

  const handleStartEditSlot = (s: BookableSlotRow) => {
    setEditingId(s.id);
    setEditSlotDate(s.slot_date);
    setEditSlotTime(s.slot_time);
    setBookableErr(null);
  };

  const handleCancelEditSlot = () => {
    setEditingId(null);
    setEditSlotDate('');
    setEditSlotTime('');
  };

  const handleSaveEditSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || editingId == null || !editSlotDate.trim() || !editSlotTime.trim()) return;
    setEditSaving(true);
    setBookableErr(null);
    try {
      const res = await fetch(`/api/admin/bookable-slots/${editingId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ slotDate: editSlotDate.trim(), slotTime: editSlotTime.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.status === 401) {
        sessionStorage.removeItem(TOKEN_KEY);
        setToken(null);
        return;
      }
      if (!res.ok) {
        setBookableErr(data.error ?? 'Could not update slot');
        return;
      }
      setEditingId(null);
      setEditSlotDate('');
      setEditSlotTime('');
      await fetchBookableSlots(token);
    } catch {
      setBookableErr('Could not reach the server.');
    } finally {
      setEditSaving(false);
    }
  };

  const slotsGroupedByDate = useMemo(() => {
    const m = new Map<string, BookableSlotRow[]>();
    for (const s of bookableSlots) {
      const list = m.get(s.slot_date) ?? [];
      list.push(s);
      m.set(s.slot_date, list);
    }
    return [...m.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, slots]) => ({
        date,
        slots: slots.sort((x, y) => x.slot_time.localeCompare(y.slot_time)),
      }));
  }, [bookableSlots]);

  const slotCountByDate = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of bookableSlots) {
      m.set(s.slot_date, (m.get(s.slot_date) ?? 0) + 1);
    }
    return m;
  }, [bookableSlots]);

  const calendarCells = useMemo(() => buildCalendarCells(calYear, calMonth), [calYear, calMonth]);

  const calendarMonthLabel = useMemo(
    () => new Date(calYear, calMonth).toLocaleString(undefined, { month: 'long', year: 'numeric' }),
    [calYear, calMonth]
  );

  useEffect(() => {
    if (!location.pathname.includes('/bookable')) return;
    const d = searchParams.get('date');
    if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
      setNewSlotDate(d);
    }
  }, [location.pathname, searchParams]);

  const handleSaveStudio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setStudioSaving(true);
    setStudioMsg(null);
    setStudioErr(null);
    try {
      const res = await fetch('/api/admin/studio-settings', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dayStart,
          dayEnd,
          slotIntervalMinutes: slotInterval,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        dayStart?: string;
        dayEnd?: string;
        slotIntervalMinutes?: number;
      };
      if (res.status === 401) {
        sessionStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setStudioErr('Session expired. Sign in again.');
        return;
      }
      if (!res.ok) {
        setStudioErr(typeof data.error === 'string' ? data.error : 'Could not save studio settings');
        return;
      }
      if (data.dayStart != null && data.dayEnd != null && data.slotIntervalMinutes != null) {
        setDayStart(data.dayStart);
        setDayEnd(data.dayEnd);
        setSlotInterval(data.slotIntervalMinutes);
      }
      setStudioMsg('Studio availability saved.');
    } catch {
      setStudioErr('Could not reach the server.');
    } finally {
      setStudioSaving(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const raw = await res.text();
      let data: { token?: string; error?: string; missingEnv?: string[] };
      try {
        data = raw ? (JSON.parse(raw) as { token?: string; error?: string; missingEnv?: string[] }) : {};
      } catch {
        setLoginError(
          res.status === 404 || res.status === 502
            ? 'API not reachable. Run `npm run dev` (Vite + API) or start the server on port 3001.'
            : `Server returned non-JSON (${res.status}). Check that the API is running.`
        );
        return;
      }
      if (!res.ok) {
        if (res.status === 503 && data.missingEnv?.length) {
          setLoginError(
            `Admin is not configured on the server. In your host’s environment (e.g. Railway → your web service → Variables), set: ${data.missingEnv.join(', ')}. Redeploy after saving.`
          );
          return;
        }
        setLoginError(data.error ?? `Login failed (${res.status})`);
        return;
      }
      if (!data.token) {
        setLoginError('Invalid response from server');
        return;
      }
      sessionStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      setPassword('');
      navigate('/admin/calendar', { replace: true });
    } catch {
      setLoginError('Could not reach the server.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setRows([]);
    setSearch('');
    setPage(1);
    setStudioMsg(null);
    setStudioErr(null);
    navigate('/admin', { replace: true });
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(
        key === 'created_at' || key === 'id' || key === 'visit_date' || key === 'visit_time' ? 'desc' : 'asc'
      );
    }
  };

  const filteredSorted = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = rows;
    if (q) {
      list = rows.filter((r) => {
        const hay = [
          r.id,
          r.name,
          r.email,
          r.mobile ?? '',
          r.type,
          r.inquiry,
          r.visit_date ?? '',
          r.visit_time ?? '',
          r.bundle_preference ?? '',
          formatBundleLabel(r.bundle_preference),
          r.prc_number ?? '',
          formatDate(r.created_at),
        ]
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      });
    }
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      let va: string | number = a[sortKey];
      let vb: string | number = b[sortKey];
      if (sortKey === 'id') {
        va = Number(a.id);
        vb = Number(b.id);
      } else if (sortKey === 'created_at') {
        va = new Date(a.created_at).getTime();
        vb = new Date(b.created_at).getTime();
      } else {
        va = String(va ?? '').toLowerCase();
        vb = String(vb ?? '').toLowerCase();
      }
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });
  }, [rows, search, sortKey, sortDir]);

  const totalFiltered = filteredSorted.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pageRows = filteredSorted.slice(pageStart, pageStart + PAGE_SIZE);
  const rangeFrom = totalFiltered === 0 ? 0 : pageStart + 1;
  const rangeTo = Math.min(pageStart + PAGE_SIZE, totalFiltered);

  useEffect(() => {
    setPage(1);
  }, [search, sortKey, sortDir]);

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const SortIcon: React.FC<{ column: SortKey }> = ({ column }) => {
    if (sortKey !== column) {
      return <ArrowUpDown className="inline w-3 h-3 opacity-40" aria-hidden />;
    }
    return sortDir === 'asc' ? (
      <ArrowUp className="inline w-3 h-3" aria-hidden />
    ) : (
      <ArrowDown className="inline w-3 h-3" aria-hidden />
    );
  };

  const adminPageTitle =
    token == null
      ? 'Admin'
      : location.pathname.includes('/calendar')
        ? 'Calendar'
        : location.pathname.includes('/bookable')
          ? 'Bookable dates & times'
          : location.pathname.includes('/template')
            ? 'Schedule template'
            : 'Inquiries';

  const sortOptions: { key: SortKey; label: string }[] = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'mobile', label: 'Mobile' },
    { key: 'type', label: 'Type' },
    { key: 'visit_date', label: 'Visit date' },
    { key: 'visit_time', label: 'Visit time' },
    { key: 'bundle_preference', label: 'Bundle' },
    { key: 'prc_number', label: 'PRC #' },
    { key: 'inquiry', label: 'Inquiry' },
    { key: 'created_at', label: 'Created' },
  ];

  return (
    <div className="min-h-screen bg-bauhaus-beige text-black">
      <header className="border-b border-black/10 bg-white px-4 py-4 sm:px-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-architect opacity-50">Planorama</p>
          <h1 className="text-xl font-black uppercase tracking-bauhaus">{adminPageTitle}</h1>
          {token && location.pathname.includes('/inquiries') ? (
            <p className="mt-1 max-w-md text-xs text-black/55 leading-snug">
              Search and sort incoming Book Studio requests.
            </p>
          ) : null}
          {token && location.pathname.includes('/bookable') ? (
            <p className="mt-1 max-w-md text-xs text-black/55 leading-snug">
              Set which calendar dates and times visitors can book.
            </p>
          ) : null}
          {token && location.pathname.includes('/template') ? (
            <p className="mt-1 max-w-md text-xs text-black/55 leading-snug">
              Default hours and spacing for &quot;Fill day&quot; on the Bookable tab.
            </p>
          ) : null}
          {token && location.pathname.includes('/calendar') ? (
            <p className="mt-1 max-w-md text-xs text-black/55 leading-snug">
              Days with slots are highlighted. Click a day to add or edit times on Bookable dates.
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {import.meta.env.DEV ? (
            <span
              className="rounded-sm border border-bauhaus-red bg-bauhaus-red/5 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-bauhaus-red"
              title="You are on the Vite dev app (port 3000). UI updates when you save files. Open http://localhost:3000/admin"
            >
              Dev · port 3000
            </span>
          ) : null}
          <Link to="/" className="text-[10px] font-bold uppercase tracking-architect border-b border-black/30 pb-0.5 hover:border-bauhaus-red hover:text-bauhaus-red">
            Back to site
          </Link>
          {token ? (
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-architect border border-black px-3 py-2 hover:bg-black hover:text-white transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          ) : null}
        </div>
      </header>

      {!token ? (
        <main className="max-w-md mx-auto px-4 py-16">
          <form onSubmit={handleLogin} className="bg-white border border-black/10 p-8 space-y-6 hairline-border">
            <p className="text-sm text-black/60">Sign in to manage scheduling and inquiries.</p>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-architect opacity-40">Username</label>
              <input
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border-b-2 border-black py-3 outline-none font-bold text-sm"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-architect opacity-40">Password</label>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border-b-2 border-black py-3 outline-none font-bold text-sm"
                required
              />
            </div>
            {loginError ? (
              <p className="text-bauhaus-red text-xs font-bold uppercase tracking-architect" role="alert">
                {loginError}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-black text-white py-4 font-bold uppercase tracking-architect text-xs hover:bg-bauhaus-red transition-colors disabled:opacity-50"
            >
              {loginLoading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </main>
      ) : (
        <>
          <nav className="sticky top-0 z-10 border-b border-black/10 bg-bauhaus-beige/95 px-4 py-3 backdrop-blur-sm sm:px-8">
            <div className="mx-auto flex max-w-[1600px] flex-wrap gap-2">
              <NavLink to="/admin/calendar" className={adminTabClass}>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  Calendar
                </span>
              </NavLink>
              <NavLink to="/admin/bookable" className={adminTabClass}>
                Bookable dates
              </NavLink>
              <NavLink to="/admin/template" className={adminTabClass}>
                Schedule template
              </NavLink>
              <NavLink to="/admin/inquiries" className={adminTabClass}>
                Inquiries
              </NavLink>
            </div>
          </nav>
          <main className="px-4 py-8 sm:px-8 max-w-[1600px] mx-auto">
            <Routes>
              <Route index element={<Navigate to="calendar" replace />} />
              <Route
                path="calendar"
                element={
                  <section className="scroll-mt-24 border border-black/15 bg-white p-6 sm:p-8 hairline-border">
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                      <p className="text-sm text-black/60">
                        Overview of days that have at least one bookable time.{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setCalYear(new Date().getFullYear());
                            setCalMonth(new Date().getMonth());
                          }}
                          className="font-bold uppercase tracking-architect text-bauhaus-blue underline decoration-bauhaus-blue/30 underline-offset-2 hover:decoration-bauhaus-blue"
                        >
                          Today
                        </button>
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (calMonth === 0) {
                              setCalYear((y) => y - 1);
                              setCalMonth(11);
                            } else {
                              setCalMonth((m) => m - 1);
                            }
                          }}
                          className="inline-flex h-10 w-10 items-center justify-center border-2 border-black bg-white hover:bg-black hover:text-white transition-colors"
                          aria-label="Previous month"
                        >
                          <ChevronLeft className="h-5 w-5" aria-hidden />
                        </button>
                        <span className="min-w-[12rem] text-center font-bold uppercase tracking-bauhaus text-sm sm:text-base">
                          {calendarMonthLabel}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (calMonth === 11) {
                              setCalYear((y) => y + 1);
                              setCalMonth(0);
                            } else {
                              setCalMonth((m) => m + 1);
                            }
                          }}
                          className="inline-flex h-10 w-10 items-center justify-center border-2 border-black bg-white hover:bg-black hover:text-white transition-colors"
                          aria-label="Next month"
                        >
                          <ChevronRight className="h-5 w-5" aria-hidden />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-7 gap-px border border-black/20 bg-black/20">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                        <div
                          key={d}
                          className="bg-black py-2 text-center text-[10px] font-bold uppercase tracking-architect text-white"
                        >
                          {d}
                        </div>
                      ))}
                      {calendarCells.map((cell, i) => {
                        if (cell == null) {
                          return <div key={`empty-${i}`} className="min-h-[4.5rem] bg-bauhaus-beige/50" />;
                        }
                        const { ymd, day } = cell;
                        const n = slotCountByDate.get(ymd) ?? 0;
                        const isToday = ymd === todayYmdLocal();
                        return (
                          <button
                            key={ymd}
                            type="button"
                            onClick={() => navigate(`/admin/bookable?date=${encodeURIComponent(ymd)}`)}
                            className={`flex min-h-[4.5rem] flex-col items-start border border-transparent bg-white p-2 text-left transition-colors hover:bg-bauhaus-beige/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bauhaus-blue ${
                              n > 0 ? 'ring-2 ring-inset ring-bauhaus-yellow/90' : ''
                            } ${isToday ? 'bg-bauhaus-yellow/15' : ''}`}
                          >
                            <span className={`font-mono text-sm tabular-nums ${isToday ? 'font-bold text-bauhaus-red' : ''}`}>
                              {day}
                            </span>
                            {n > 0 ? (
                              <span className="mt-auto font-mono text-[10px] text-black/60">{n} slot{n === 1 ? '' : 's'}</span>
                            ) : (
                              <span className="mt-auto text-[10px] text-black/25">—</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {bookableLoading ? (
                      <p className="mt-4 font-mono text-xs text-black/45">Loading availability…</p>
                    ) : null}
                  </section>
                }
              />
              <Route
                path="bookable"
                element={
                  <section id="bookable-calendar" className="scroll-mt-24 border border-black/15 bg-white p-6 sm:p-8 hairline-border">
            <p className="text-sm text-black/60 mb-8">
              Visitors choose a <strong className="text-black/80">calendar date</strong>, then a <strong className="text-black/80">time</strong> from what you save below. Everything you add appears in <strong className="text-black/80">Saved availability</strong> — edit or remove each row.
            </p>

            <div className="mb-10 rounded-sm border-2 border-black/20 bg-bauhaus-beige/40 p-5 sm:p-6">
              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-base font-black uppercase tracking-bauhaus text-black">Saved availability</h3>
                <span className="font-mono text-xs text-black/50 tabular-nums">
                  {bookableLoading ? '…' : `${bookableSlots.length} slot${bookableSlots.length === 1 ? '' : 's'}`}
                </span>
              </div>
              {bookableLoading ? (
                <p className="font-mono text-sm text-black/50">Loading saved slots…</p>
              ) : bookableSlots.length === 0 ? (
                <p className="text-sm text-black/60 leading-relaxed">
                  Nothing saved yet. Use <strong className="text-black/80">Add slot</strong> or <strong className="text-black/80">Fill day</strong> below — then your dates and times will show up here, grouped by date.
                </p>
              ) : (
                <ul className="space-y-6">
                  {slotsGroupedByDate.map(({ date, slots }) => (
                    <li key={date}>
                      <p className="mb-2 border-b border-black/15 pb-1 font-mono text-xs font-bold uppercase tracking-architect text-black/50">
                        {date}{' '}
                        <span className="font-sans font-bold normal-case tracking-normal text-black">
                          — {formatSlotDateHeading(date)}
                        </span>
                      </p>
                      <ul className="space-y-2">
                        {slots.map((s) => (
                          <li key={s.id}>
                            {editingId === s.id ? (
                              <form
                                onSubmit={handleSaveEditSlot}
                                className="flex flex-col gap-3 rounded border border-black/20 bg-white p-3 sm:flex-row sm:flex-wrap sm:items-end"
                              >
                                <label className="block space-y-1">
                                  <span className="text-[10px] font-bold uppercase tracking-architect opacity-40">Date</span>
                                  <input
                                    type="date"
                                    value={editSlotDate}
                                    onChange={(e) => setEditSlotDate(e.target.value)}
                                    className="border-2 border-black px-2 py-2 font-mono text-sm outline-none focus:border-bauhaus-blue"
                                    required
                                  />
                                </label>
                                <label className="block space-y-1">
                                  <span className="text-[10px] font-bold uppercase tracking-architect opacity-40">Time</span>
                                  <input
                                    type="time"
                                    value={editSlotTime}
                                    onChange={(e) => setEditSlotTime(e.target.value)}
                                    className="border-2 border-black px-2 py-2 font-mono text-sm outline-none focus:border-bauhaus-blue"
                                    required
                                  />
                                </label>
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="submit"
                                    disabled={editSaving}
                                    className="border-2 border-black bg-black px-4 py-2 text-[10px] font-bold uppercase tracking-architect text-white hover:bg-bauhaus-red disabled:opacity-50"
                                  >
                                    {editSaving ? 'Saving…' : 'Save'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleCancelEditSlot}
                                    className="border-2 border-black bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-architect hover:bg-black/5"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </form>
                            ) : (
                              <div className="flex flex-wrap items-center justify-between gap-3 border border-black/10 bg-white px-3 py-2.5">
                                <span className="font-mono text-sm tabular-nums">
                                  <span className="text-black/40">Time</span> {formatTime12Hour(s.slot_time)}
                                </span>
                                <div className="flex items-center gap-3">
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditSlot(s)}
                                    className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-architect text-bauhaus-blue hover:underline"
                                  >
                                    <Pencil className="h-3.5 w-3.5" aria-hidden />
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void handleDeleteBookableSlot(s.id)}
                                    className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-architect text-bauhaus-red hover:underline"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                                    Delete
                                  </button>
                                </div>
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <h3 className="mb-4 text-sm font-black uppercase tracking-bauhaus text-black/80">Add or bulk-fill slots</h3>
            <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
              <form onSubmit={handleAddBookableSlot} className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
                <label className="block space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-architect opacity-40">Date</span>
                  <input
                    type="date"
                    value={newSlotDate}
                    onChange={(e) => setNewSlotDate(e.target.value)}
                    className="w-full min-w-[10rem] border-2 border-black px-3 py-2 font-mono text-sm outline-none focus:border-bauhaus-blue sm:w-auto"
                    required
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-architect opacity-40">Time</span>
                  <input
                    type="time"
                    value={newSlotTime}
                    onChange={(e) => setNewSlotTime(e.target.value)}
                    className="w-full min-w-[8rem] border-2 border-black px-3 py-2 font-mono text-sm outline-none focus:border-bauhaus-blue sm:w-auto"
                    required
                  />
                </label>
                <button
                  type="submit"
                  disabled={addSlotBusy || bookableLoading}
                  className="border-2 border-black bg-black px-5 py-2.5 text-[10px] font-bold uppercase tracking-architect text-white transition-colors hover:bg-bauhaus-red disabled:opacity-50"
                >
                  {addSlotBusy ? 'Adding…' : 'Add slot'}
                </button>
              </form>

              <form onSubmit={handleFillDayFromTemplate} className="flex flex-col gap-3 border-t border-black/10 pt-6 lg:border-t-0 lg:pt-0 lg:pl-8 lg:border-l border-black/10">
                <p className="text-[10px] font-bold uppercase tracking-architect opacity-40">Fill whole day from template</p>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <label className="block space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-architect opacity-40">Date</span>
                    <input
                      type="date"
                      value={fillTemplateDate}
                      onChange={(e) => setFillTemplateDate(e.target.value)}
                      className="w-full border-2 border-black px-3 py-2 font-mono text-sm outline-none focus:border-bauhaus-blue"
                      required
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={fillBusy || bookableLoading}
                    className="shrink-0 border-2 border-black bg-white px-5 py-2.5 text-[10px] font-bold uppercase tracking-architect transition-colors hover:bg-bauhaus-beige disabled:opacity-50"
                  >
                    {fillBusy ? 'Filling…' : 'Fill day'}
                  </button>
                </div>
              </form>
            </div>

            {bookableErr ? (
              <p className="mt-6 text-bauhaus-red text-xs font-bold uppercase tracking-architect" role="alert">
                {bookableErr}
              </p>
            ) : null}
                  </section>
                }
              />
              <Route
                path="template"
                element={
                  <section id="studio-schedule" className="scroll-mt-24 border border-black/15 bg-white p-6 sm:p-8 hairline-border">
            <p className="text-sm text-black/60 mb-6">
              Default open hours and slot spacing. Save this first, then use <strong className="text-black/80">Fill day</strong> on the <strong className="text-black/80">Bookable dates</strong> tab to generate all times for one calendar date at once.
            </p>
            <p className="mb-6 rounded-sm border border-black/10 bg-bauhaus-beige/80 px-4 py-3 text-xs text-black/70 leading-relaxed">
              <strong className="text-black">Slot interval</strong> is only the gap between times (15 / 30 / 60 / 90 / 120 <strong>minutes</strong>). It is{' '}
              <strong>not</strong> for choosing calendar days — those are set on the <strong>Bookable dates</strong> tab.
            </p>
            <form onSubmit={handleSaveStudio} className="flex flex-col gap-6 lg:flex-row lg:flex-wrap lg:items-end">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
                <label className="block space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-architect opacity-40">Start time</span>
                  <input
                    type="time"
                    value={dayStart}
                    onChange={(e) => setDayStart(e.target.value)}
                    disabled={studioLoading || studioSaving}
                    className="w-full border-2 border-black px-3 py-2 font-mono text-sm outline-none focus:border-bauhaus-blue disabled:opacity-50"
                    required
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-architect opacity-40">End time</span>
                  <input
                    type="time"
                    value={dayEnd}
                    onChange={(e) => setDayEnd(e.target.value)}
                    disabled={studioLoading || studioSaving}
                    className="w-full border-2 border-black px-3 py-2 font-mono text-sm outline-none focus:border-bauhaus-blue disabled:opacity-50"
                    required
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-architect opacity-40">Slot interval</span>
                  <select
                    value={slotInterval}
                    onChange={(e) => setSlotInterval(Number(e.target.value))}
                    disabled={studioLoading || studioSaving}
                    className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-sm outline-none focus:border-bauhaus-blue disabled:opacity-50"
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={60}>60 minutes</option>
                    <option value={90}>90 minutes</option>
                    <option value={120}>120 minutes</option>
                  </select>
                </label>
              </div>
              <button
                type="submit"
                disabled={studioLoading || studioSaving}
                className="shrink-0 border-2 border-black bg-black px-6 py-2.5 text-[10px] font-bold uppercase tracking-architect text-white transition-colors hover:bg-bauhaus-red disabled:opacity-50"
              >
                {studioSaving ? 'Saving…' : 'Save template'}
              </button>
            </form>
            {studioLoading ? (
              <p className="mt-4 text-[10px] font-mono text-black/40">Loading settings…</p>
            ) : null}
            {studioErr ? (
              <p className="mt-4 text-bauhaus-red text-xs font-bold uppercase tracking-architect" role="alert">
                {studioErr}
              </p>
            ) : null}
            {studioMsg ? (
              <p className="mt-4 text-xs font-bold uppercase tracking-architect text-black/70" role="status">
                {studioMsg}
              </p>
            ) : null}
                  </section>
                }
              />
              <Route
                path="inquiries"
                element={
                  <>
                    <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <label className="block flex-1 max-w-md">
              <span className="text-[10px] font-bold uppercase tracking-architect opacity-40 block mb-2">Search</span>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter any column…"
                className="w-full border-2 border-black px-3 py-2 font-mono text-sm outline-none focus:border-bauhaus-blue"
              />
            </label>
            {loading ? (
              <span className="text-[10px] font-bold uppercase tracking-architect opacity-50">Loading…</span>
            ) : null}
          </div>

          <div className="md:hidden mb-5 flex flex-wrap items-end gap-3">
            <label className="flex min-w-[160px] flex-1 flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-architect opacity-40">Sort by</span>
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                className="border-2 border-black bg-white px-2 py-2.5 font-mono text-xs outline-none focus:border-bauhaus-blue"
              >
                {sortOptions.map(({ key, label }) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
              className="flex shrink-0 items-center gap-1.5 border-2 border-black bg-white px-3 py-2.5 text-[10px] font-bold uppercase tracking-architect hover:bg-black hover:text-white transition-colors"
            >
              {sortDir === 'asc' ? (
                <>
                  <ArrowUp className="h-3.5 w-3.5" aria-hidden />
                  Asc
                </>
              ) : (
                <>
                  <ArrowDown className="h-3.5 w-3.5" aria-hidden />
                  Desc
                </>
              )}
            </button>
          </div>

          {loadError ? (
            <p className="text-bauhaus-red text-sm font-bold mb-4" role="alert">
              {loadError}
            </p>
          ) : null}

          <div className="md:hidden space-y-4">
            {totalFiltered === 0 ? (
              <div className="border border-black/15 bg-white p-8 text-center font-mono text-xs text-black/50 hairline-border">
                {rows.length === 0 ? 'No inquiries yet.' : 'No rows match your search.'}
              </div>
            ) : (
              pageRows.map((r) => (
                <article
                  key={r.id}
                  className="border border-black/15 bg-white p-4 shadow-sm hairline-border"
                >
                  <dl className="space-y-3 text-sm">
                    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-black/10 pb-2">
                      <dt className="text-[10px] font-bold uppercase tracking-architect text-black/45">ID</dt>
                      <dd className="font-mono text-xs">{r.id}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-bold uppercase tracking-architect text-black/45">Name</dt>
                      <dd className="mt-1 font-bold uppercase text-xs break-words">{r.name}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-bold uppercase tracking-architect text-black/45">Email</dt>
                      <dd className="mt-1 font-mono text-xs break-all">
                        <EmailLink email={r.email} />
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-bold uppercase tracking-architect text-black/45">Mobile</dt>
                      <dd className="mt-1">
                        <MobileLinkBar mobile={r.mobile} />
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-bold uppercase tracking-architect text-black/45">Type</dt>
                      <dd className="mt-1 text-xs uppercase">{r.type}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-bold uppercase tracking-architect text-black/45">Visit date</dt>
                      <dd className="mt-1 font-mono text-xs">{r.visit_date ?? '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-bold uppercase tracking-architect text-black/45">Visit time</dt>
                      <dd className="mt-1 text-xs tabular-nums">{displayVisitTime(r.visit_time)}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-bold uppercase tracking-architect text-black/45">Bundle</dt>
                      <dd className="mt-1 text-xs leading-snug">{formatBundleLabel(r.bundle_preference)}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-bold uppercase tracking-architect text-black/45">PRC #</dt>
                      <dd className="mt-1 font-mono text-xs break-words">{r.prc_number ?? '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-bold uppercase tracking-architect text-black/45">Inquiry</dt>
                      <dd className="mt-1 whitespace-pre-wrap break-words text-xs leading-relaxed">{r.inquiry}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-bold uppercase tracking-architect text-black/45">Created</dt>
                      <dd className="mt-1 font-mono text-xs">{formatDate(r.created_at)}</dd>
                    </div>
                  </dl>
                </article>
              ))
            )}
          </div>

          <div className="hidden overflow-x-auto border border-black/15 bg-white hairline-border md:block">
            <table className="w-full text-left text-sm min-w-[1100px]">
              <thead>
                <tr className="border-b border-black bg-black text-white">
                  {(
                    [
                      ['id', 'ID'],
                      ['name', 'Name'],
                      ['email', 'Email'],
                      ['mobile', 'Mobile'],
                      ['type', 'Type'],
                      ['visit_date', 'Visit'],
                      ['visit_time', 'Time'],
                      ['bundle_preference', 'Bundle'],
                      ['prc_number', 'PRC'],
                      ['inquiry', 'Inquiry'],
                      ['created_at', 'Created'],
                    ] as const
                  ).map(([key, label]) => (
                    <th key={key} className="p-3 font-bold uppercase text-[10px] tracking-architect">
                      <button
                        type="button"
                        onClick={() => toggleSort(key)}
                        className="inline-flex items-center gap-1 hover:text-bauhaus-yellow transition-colors"
                      >
                        {label}
                        <SortIcon column={key} />
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {totalFiltered === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-black/50 font-mono text-xs">
                      {rows.length === 0 ? 'No inquiries yet.' : 'No rows match your search.'}
                    </td>
                  </tr>
                ) : (
                  pageRows.map((r) => (
                    <tr key={r.id} className="border-b border-black/10 hover:bg-bauhaus-beige/80">
                      <td className="p-3 font-mono text-xs align-top">{r.id}</td>
                      <td className="p-3 font-bold uppercase text-xs align-top max-w-[140px] break-words">{r.name}</td>
                      <td className="p-3 font-mono text-xs align-top max-w-[200px] break-all">
                        <EmailLink email={r.email} />
                      </td>
                      <td className="p-3 align-top max-w-[180px]">
                        <MobileLinkBar mobile={r.mobile} />
                      </td>
                      <td className="p-3 uppercase text-xs align-top max-w-[160px]">{r.type}</td>
                      <td className="p-3 font-mono text-xs align-top whitespace-nowrap">{r.visit_date ?? '—'}</td>
                      <td className="p-3 text-xs align-top whitespace-nowrap tabular-nums">{displayVisitTime(r.visit_time)}</td>
                      <td className="p-3 text-xs align-top max-w-[140px]">{formatBundleLabel(r.bundle_preference)}</td>
                      <td className="p-3 font-mono text-xs align-top max-w-[100px] break-words">{r.prc_number ?? '—'}</td>
                      <td className="p-3 text-xs align-top max-w-md whitespace-pre-wrap break-words" title={r.inquiry}>
                        {r.inquiry}
                      </td>
                      <td className="p-3 font-mono text-xs align-top whitespace-nowrap">{formatDate(r.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalFiltered > 0 ? (
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-[10px] font-mono text-black/40">
                Rows {rangeFrom}–{rangeTo} of {totalFiltered} filtered ({rows.length} loaded)
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="text-[10px] font-bold uppercase tracking-architect border border-black px-3 py-2 hover:bg-black hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  Previous
                </button>
                <span className="text-[10px] font-mono text-black/60 tabular-nums">
                  Page {safePage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="text-[10px] font-bold uppercase tracking-architect border border-black px-3 py-2 hover:bg-black hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-[10px] font-mono text-black/40">
              Showing 0 of {rows.length} loaded
            </p>
          )}
                  </>
                }
              />
              <Route path="*" element={<Navigate to="/admin/calendar" replace />} />
            </Routes>
          </main>
        </>
      )}
    </div>
  );
};

export default Admin;
