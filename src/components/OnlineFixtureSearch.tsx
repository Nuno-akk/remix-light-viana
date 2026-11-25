import {useCallback, useEffect, useState} from 'react';
import {Globe, HardDrive, Loader2, RefreshCw, Search} from 'lucide-react';
import {ParsedFixtureProfile, parseOflJsonProfile} from '../engine/fixtureImporter';
import {
  loadCachedOflIndex,
  loadCachedOflProfile,
  loadCachedProfileEntries,
  OFFLINE_BUILTIN_ENTRIES,
  OFFLINE_FIXTURE_PROFILES,
  OfflineSearchEntry,
  saveCachedOflIndex,
  saveCachedOflProfile,
} from '../engine/offlineFixtureLibrary';
import {useOnlineStatus} from '../hooks/usePWAInstall';
import {useLanguage} from '../i18n/LanguageContext';

interface OnlineManufacturer {
  key: string;
  name: string;
}

interface OnlineFixtureSearchProps {
  onSelectProfile: (profile: ParsedFixtureProfile) => void;
}

function searchLocalCatalog(
  q: string,
  mfg: string,
): {
  entries: OfflineSearchEntry[];
  manufacturers: OnlineManufacturer[];
  totalCount: number;
  matchCount: number;
} {
  const cachedIndex = loadCachedOflIndex();
  const cachedProfiles = loadCachedProfileEntries();
  const seen = new Set<string>();
  const combined: OfflineSearchEntry[] = [];

  for (const item of [
    ...OFFLINE_BUILTIN_ENTRIES,
    ...cachedProfiles,
    ...(cachedIndex?.entries || []),
  ]) {
    if (seen.has(item.path)) continue;
    seen.add(item.path);
    combined.push(item);
  }

  const mfgMap = new Map<string, string>();
  mfgMap.set('generic-stage', 'Generic Stage');
  for (const m of cachedIndex?.manufacturers || []) {
    mfgMap.set(m.key, m.name);
  }
  for (const item of cachedProfiles) {
    mfgMap.set(item.manufacturerKey, item.manufacturerName);
  }

  const mfgList = Array.from(mfgMap.entries())
    .map(([key, name]) => ({key, name}))
    .sort((a, b) => a.name.localeCompare(b.name));

  const qLower = q.trim().toLowerCase();
  const mfgLower = mfg.trim().toLowerCase();
  const filtered = combined.filter((entry) => {
    if (mfgLower && entry.manufacturerKey !== mfgLower) return false;
    if (!qLower) return true;
    return (
      entry.displayName.toLowerCase().includes(qLower) ||
      entry.manufacturerName.toLowerCase().includes(qLower) ||
      entry.fixtureSlug.toLowerCase().includes(qLower)
    );
  });

  return {
    entries: filtered.slice(0, 40),
    manufacturers: mfgList,
    totalCount: combined.length,
    matchCount: filtered.length,
  };
}

export function OnlineFixtureSearch({onSelectProfile}: OnlineFixtureSearchProps) {
  const {t} = useLanguage();
  const isOnline = useOnlineStatus();
  const [query, setQuery] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [manufacturers, setManufacturers] = useState<OnlineManufacturer[]>([]);
  const [results, setResults] = useState<OfflineSearchEntry[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [matchCount, setMatchCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingPath, setLoadingPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usingOfflineCatalog, setUsingOfflineCatalog] = useState<boolean>(false);

  const isFileProtocol =
    typeof window !== 'undefined' && window.location.protocol === 'file:';

  const applyLocalFallback = useCallback((q: string, mfg: string) => {
    const local = searchLocalCatalog(q, mfg);
    setManufacturers(local.manufacturers);
    setTotalCount(local.totalCount);
    setMatchCount(local.matchCount);
    setResults(local.entries);
    setUsingOfflineCatalog(true);
    setError(null);
  }, []);

  const runSearch = useCallback(
    async (q: string, mfg: string) => {
      if (!isOnline) {
        applyLocalFallback(q, mfg);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      setUsingOfflineCatalog(false);
      try {
        if (isFileProtocol) {
          const [mfgRes, treeRes] = await Promise.all([
            fetch(
              'https://raw.githubusercontent.com/OpenLightingProject/open-fixture-library/master/fixtures/manufacturers.json',
            ),
            fetch(
              'https://api.github.com/repos/OpenLightingProject/open-fixture-library/git/trees/master?recursive=1',
            ),
          ]);
          if (!mfgRes.ok || !treeRes.ok) {
            throw new Error(t.oflSearchError);
          }
          const mfgJson = (await mfgRes.json()) as Record<string, {name?: string}>;
          const treeJson = (await treeRes.json()) as {
            tree?: Array<{path?: string; type?: string}>;
          };
          const entries: OfflineSearchEntry[] = [];
          for (const item of treeJson.tree || []) {
            if (item.type !== 'blob' || !item.path) continue;
            const match = /^fixtures\/([^/]+)\/([^/]+)\.json$/.exec(item.path);
            if (!match) continue;
            const [, mfgKey, slug] = match;
            const mfgName = mfgJson[mfgKey]?.name || mfgKey;
            const displayName = slug
              .split('-')
              .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : w))
              .join(' ');
            entries.push({
              path: item.path,
              manufacturerKey: mfgKey,
              manufacturerName: mfgName,
              fixtureSlug: slug,
              displayName,
            });
          }
          const mfgList = Object.entries(mfgJson)
            .filter(([k]) => k !== '$schema')
            .map(([key, v]) => ({key, name: v?.name || key}))
            .sort((a, b) => a.name.localeCompare(b.name));
          saveCachedOflIndex({manufacturers: mfgList, entries});
          const qLower = q.trim().toLowerCase();
          const mfgLower = mfg.trim().toLowerCase();
          const filtered = entries.filter((entry) => {
            if (mfgLower && entry.manufacturerKey !== mfgLower) return false;
            if (!qLower) return true;
            return (
              entry.displayName.toLowerCase().includes(qLower) ||
              entry.manufacturerName.toLowerCase().includes(qLower) ||
              entry.fixtureSlug.toLowerCase().includes(qLower)
            );
          });
          setTotalCount(entries.length);
          setMatchCount(filtered.length);
          setManufacturers(mfgList);
          setResults(filtered.slice(0, 40));
          return;
        }

        const params = new URLSearchParams();
        if (q.trim()) params.set('q', q.trim());
        if (mfg) params.set('manufacturer', mfg);

        const res = await fetch(`/api/fixtures/online/search?${params.toString()}`);
        const data = (await res.json()) as {
          totalCount?: number;
          matchCount?: number;
          manufacturers?: OnlineManufacturer[];
          results?: OfflineSearchEntry[];
          error?: string;
        };
        if (!res.ok) {
          throw new Error(data.error || t.oflSearchError);
        }
        const fetchedResults = Array.isArray(data.results) ? data.results : [];
        const fetchedMfgs = Array.isArray(data.manufacturers)
          ? data.manufacturers
          : [];
        if (fetchedResults.length > 0 && fetchedMfgs.length > 0 && !q.trim() && !mfg) {
          saveCachedOflIndex({
            manufacturers: fetchedMfgs,
            entries: fetchedResults,
          });
        }
        setTotalCount(data.totalCount ?? 0);
        setMatchCount(data.matchCount ?? 0);
        if (fetchedMfgs.length > 0) {
          setManufacturers(fetchedMfgs);
        }
        setResults(fetchedResults);
      } catch {
        // Fall back seamlessly to local built-in + cached fixtures when offline/unreachable
        applyLocalFallback(q, mfg);
      } finally {
        setLoading(false);
      }
    },
    [applyLocalFallback, isFileProtocol, isOnline, t.oflSearchError],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void runSearch(query, manufacturer);
    }, 240);
    return () => window.clearTimeout(timer);
  }, [query, manufacturer, runSearch]);

  const handleLoadFixture = async (entry: OfflineSearchEntry) => {
    const localProfile =
      OFFLINE_FIXTURE_PROFILES[entry.path] || loadCachedOflProfile(entry.path);
    if (localProfile && (!isOnline || entry.path.startsWith('offline://'))) {
      onSelectProfile(localProfile);
      return;
    }

    setLoadingPath(entry.path);
    setError(null);
    try {
      if (isFileProtocol) {
        if (!/^fixtures\/[a-z0-9-]+\/[a-z0-9-]+\.json$/.test(entry.path)) {
          throw new Error(t.oflDownloadError);
        }
        const rawRes = await fetch(
          `https://raw.githubusercontent.com/OpenLightingProject/open-fixture-library/master/${entry.path}`,
        );
        if (!rawRes.ok) {
          throw new Error(t.oflDownloadError);
        }
        const rawText = await rawRes.text();
        const parsed = parseOflJsonProfile(rawText, `${entry.fixtureSlug}.json`);
        parsed.manufacturer = entry.manufacturerName;
        saveCachedOflProfile(entry.path, parsed);
        onSelectProfile(parsed);
        return;
      }

      const res = await fetch(
        `/api/fixtures/online/profile?path=${encodeURIComponent(entry.path)}`,
      );
      const data = (await res.json()) as {
        manufacturerName?: string;
        profile?: Record<string, unknown>;
        error?: string;
      };
      if (!res.ok || !data.profile) {
        throw new Error(data.error || t.oflDownloadError);
      }

      const parsed = parseOflJsonProfile(
        JSON.stringify(data.profile),
        `${entry.fixtureSlug}.json`,
      );
      parsed.manufacturer = data.manufacturerName || entry.manufacturerName;
      saveCachedOflProfile(entry.path, parsed);
      onSelectProfile(parsed);
    } catch (err) {
      if (localProfile) {
        onSelectProfile(localProfile);
        return;
      }
      setError(err instanceof Error ? err.message : t.oflDownloadError);
    } finally {
      setLoadingPath(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          {usingOfflineCatalog ? (
            <HardDrive className="h-3.5 w-3.5 text-amber-400" />
          ) : (
            <Globe className="h-3.5 w-3.5 text-sky-400" />
          )}
          <span>{t.oflTitle}</span>
        </div>
        {totalCount > 0 && (
          <span className="font-mono-tabular text-[11px] text-slate-400">
            {matchCount} / {totalCount}
          </span>
        )}
      </div>

      {usingOfflineCatalog && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200">
          <span>{t.oflOfflineNotice}</span>
          {isOnline && (
            <button
              type="button"
              onClick={() => void runSearch(query, manufacturer)}
              className="inline-flex items-center gap-1 text-amber-100 underline shrink-0"
            >
              <RefreshCw className="h-3 w-3" />
              <span>{t.oflRetry}</span>
            </button>
          )}
        </div>
      )}

      <div className="space-y-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.oflSearchPlaceholder}
            aria-label={t.oflSearchPlaceholder}
            className="h-9 w-full rounded-lg border border-white/10 bg-[#0B101B] pl-8 pr-3 text-xs text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
          />
        </div>

        <select
          value={manufacturer}
          onChange={(e) => setManufacturer(e.target.value)}
          aria-label={t.oflAllManufacturers}
          className="h-9 w-full rounded-lg border border-white/10 bg-[#0B101B] px-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
        >
          <option value="">{t.oflAllManufacturers} ({manufacturers.length || '...'})</option>
          {manufacturers.map((m) => (
            <option key={m.key} value={m.key}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
          <span className="truncate">{error}</span>
          <button
            type="button"
            onClick={() => void runSearch(query, manufacturer)}
            className="inline-flex items-center gap-1 text-rose-100 underline shrink-0"
          >
            <RefreshCw className="h-3 w-3" />
            <span>{t.oflRetry}</span>
          </button>
        </div>
      )}

      {loading && results.length === 0 ? (
        <div className="space-y-1.5">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className="h-12 animate-pulse rounded-lg border border-white/5 bg-[#0B101B]"
            />
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="rounded-lg border border-white/8 bg-[#0B101B] py-6 text-center text-xs text-slate-400">
          {t.oflEmpty}
        </div>
      ) : (
        <div className="max-h-[260px] space-y-1.5 overflow-y-auto pr-1">
          {results.map((entry) => {
            const isPicking = loadingPath === entry.path;
            const hasLocal =
              Boolean(OFFLINE_FIXTURE_PROFILES[entry.path]) ||
              Boolean(loadCachedOflProfile(entry.path));
            return (
              <button
                key={entry.path}
                type="button"
                disabled={Boolean(loadingPath)}
                onClick={() => void handleLoadFixture(entry)}
                className="flex w-full items-center justify-between gap-2 rounded-lg border border-white/8 bg-[#0B101B] px-3 py-2 text-left transition-colors hover:border-sky-500/50 hover:bg-[#151D2E] disabled:opacity-60"
              >
                <div className="min-w-0">
                  <div className="truncate text-xs font-medium text-white">
                    {entry.displayName}
                  </div>
                  <div className="truncate text-[11px] text-slate-400">
                    {entry.manufacturerName}
                    {hasLocal && (
                      <>
                        {' · '}
                        <span className="text-emerald-400">{t.oflOfflineTag}</span>
                      </>
                    )}
                  </div>
                </div>
                {isPicking ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-400 shrink-0" />
                ) : (
                  <span className="text-[11px] font-medium text-sky-400 shrink-0">
                    {t.oflLoad}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
