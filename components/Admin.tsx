import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUp, ArrowUpDown, LogOut } from 'lucide-react';

const TOKEN_KEY = 'planorama_admin_token';

export type InquiryRow = {
  id: number;
  name: string;
  email: string;
  type: string;
  inquiry: string;
  created_at: string;
};

type SortKey = keyof InquiryRow;
type SortDir = 'asc' | 'desc';

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
      let data: { token?: string; error?: string };
      try {
        data = raw ? (JSON.parse(raw) as { token?: string; error?: string }) : {};
      } catch {
        setLoginError(
          res.status === 404 || res.status === 502
            ? 'API not reachable. Run `npm run dev` (Vite + API) or start the server on port 3001.'
            : `Server returned non-JSON (${res.status}). Check that the API is running.`
        );
        return;
      }
      if (!res.ok) {
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
        const hay = [r.id, r.name, r.email, r.type, r.inquiry, formatDate(r.created_at)]
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
        va = String(va).toLowerCase();
        vb = String(vb).toLowerCase();
      }
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });
  }, [rows, search, sortKey, sortDir]);

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

          {loadError ? (
            <p className="text-bauhaus-red text-sm font-bold mb-4" role="alert">
              {loadError}
            </p>
          ) : null}

          <div className="overflow-x-auto border border-black/15 bg-white hairline-border">
            <table className="w-full text-left text-sm min-w-[800px]">
              <thead>
                <tr className="border-b border-black bg-black text-white">
                  {(
                    [
                      ['id', 'ID'],
                      ['name', 'Name'],
                      ['email', 'Email'],
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
                {filteredSorted.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-black/50 font-mono text-xs">
                      {rows.length === 0 ? 'No inquiries yet.' : 'No rows match your search.'}
                    </td>
                  </tr>
                ) : (
                  filteredSorted.map((r) => (
                    <tr key={r.id} className="border-b border-black/10 hover:bg-bauhaus-beige/80">
                      <td className="p-3 font-mono text-xs align-top">{r.id}</td>
                      <td className="p-3 font-bold uppercase text-xs align-top max-w-[140px] break-words">{r.name}</td>
                      <td className="p-3 font-mono text-xs align-top max-w-[200px] break-all">{r.email}</td>
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

          <p className="mt-4 text-[10px] font-mono text-black/40">
            Showing {filteredSorted.length} of {rows.length} loaded
          </p>
        </main>
      )}
    </div>
  );
};

export default Admin;
