import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUp, ArrowUpDown, LogOut, MessageSquare, Phone } from 'lucide-react';

const TOKEN_KEY = 'planorama_admin_token';

export type InquiryRow = {
  id: number;
  name: string;
  email: string;
  mobile: string | null;
  type: string;
  inquiry: string;
  created_at: string;
};

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

const Admin: React.FC = () => {
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
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'created_at' || key === 'id' ? 'desc' : 'asc');
    }
  };

  const filteredSorted = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = rows;
    if (q) {
      list = rows.filter((r) => {
        const hay = [r.id, r.name, r.email, r.mobile ?? '', r.type, r.inquiry, formatDate(r.created_at)]
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

  const sortOptions: { key: SortKey; label: string }[] = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'mobile', label: 'Mobile' },
    { key: 'type', label: 'Type' },
    { key: 'inquiry', label: 'Inquiry' },
    { key: 'created_at', label: 'Created' },
  ];

  return (
    <div className="min-h-screen bg-bauhaus-beige text-black">
      <header className="border-b border-black/10 bg-white px-4 py-4 sm:px-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-architect opacity-50">Planorama</p>
          <h1 className="text-xl font-black uppercase tracking-bauhaus">Inquiries</h1>
        </div>
        <div className="flex items-center gap-4">
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
            <p className="text-sm text-black/60">Sign in to view inquiries.</p>
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
        <main className="px-4 py-8 sm:px-8 max-w-[1600px] mx-auto">
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
            <table className="w-full text-left text-sm min-w-[800px]">
              <thead>
                <tr className="border-b border-black bg-black text-white">
                  {(
                    [
                      ['id', 'ID'],
                      ['name', 'Name'],
                      ['email', 'Email'],
                      ['mobile', 'Mobile'],
                      ['type', 'Type'],
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
                    <td colSpan={7} className="p-8 text-center text-black/50 font-mono text-xs">
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
        </main>
      )}
    </div>
  );
};

export default Admin;
