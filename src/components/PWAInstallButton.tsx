import {useEffect, useState} from 'react';
import {Download, Smartphone, WifiOff} from 'lucide-react';
import {useOnlineStatus, usePWAInstall} from '../hooks/usePWAInstall';
import {useLanguage} from '../i18n/LanguageContext';

export function useOfflineReady(): boolean {
  const [ready, setReady] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    if (window.location.protocol === 'file:') return true;
    return Boolean(window.__lightvianaOfflineReady);
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.location.protocol === 'file:' || window.__lightvianaOfflineReady) {
      setReady(true);
      return;
    }

    const onReady = () => setReady(true);
    window.addEventListener('lightviana:offline-ready', onReady);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then(() => {
          window.__lightvianaOfflineReady = true;
          setReady(true);
        })
        .catch(() => {
          // Ignore service worker check error
        });
    }

    return () => {
      window.removeEventListener('lightviana:offline-ready', onReady);
    };
  }, []);

  return ready;
}

export function PWAInstallButton() {
  const {t} = useLanguage();
  const {isInstallable, isInstalled, isIOS, install} = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return (
      <span className="text-xs font-medium text-emerald-300">
        {t.pwaInstalled}
      </span>
    );
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => void install()}
        className="flex min-h-[40px] items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 transition-colors hover:bg-sky-400 whitespace-nowrap shrink-0"
      >
        <Download className="h-4 w-4" />
        <span>{t.pwaInstallBtn}</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="flex min-h-[40px] items-center gap-2 rounded-lg border border-white/15 bg-[#151D2E] px-3.5 py-2 text-xs font-medium text-white hover:border-sky-500/50 whitespace-nowrap shrink-0"
        >
          <Smartphone className="h-4 w-4 text-sky-400" />
          <span>{t.pwaIosBtn}</span>
        </button>

        {showIOSGuide && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          >
            <div className="w-full max-w-sm rounded-xl border border-white/15 bg-[#101624] p-5 shadow-2xl">
              <h3 className="font-display text-base font-semibold text-white">
                {t.pwaIosModalTitle}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-300">
                {t.pwaIosStep1Before} <strong>{t.pwaIosStep1Strong}</strong> {t.pwaIosStep1After}
                <br />
                {t.pwaIosStep2Before} <strong>{t.pwaIosStep2Strong}</strong>.
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 min-h-[40px] w-full rounded-lg bg-sky-500 py-2 text-xs font-semibold text-slate-950 hover:bg-sky-400"
              >
                {t.stageClose}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <span className="text-xs text-slate-400">
      {t.pwaManualHint}
    </span>
  );
}

export function OfflineIndicator() {
  const {t} = useLanguage();
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-lg border border-amber-500/40 bg-[#151D2E]/95 px-3.5 py-2 text-xs font-medium text-amber-200 shadow-lg backdrop-blur-sm"
    >
      <WifiOff className="h-3.5 w-3.5 shrink-0 text-amber-300" />
      <span>{t.offlineBanner}</span>
    </div>
  );
}
