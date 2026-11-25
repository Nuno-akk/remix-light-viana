import {useEffect, useRef, useState} from 'react';
import {
  AlertTriangle,
  Check,
  Download,
  Globe,
  HardDrive,
  KeyRound,
  Laptop,
  Loader2,
  Lock,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Tablet,
  Unlock,
  Upload,
  WifiOff,
  X,
} from 'lucide-react';
import {useOnlineStatus} from '../hooks/usePWAInstall';
import {PWAInstallButton, useOfflineReady} from './PWAInstallButton';
import {useLanguage} from '../i18n/LanguageContext';
import {AppLanguage, LANGUAGE_LABELS} from '../i18n/translations';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tabletMode: boolean;
  onToggleTabletMode: () => void;
  onDownloadBackup: () => {presets: number; banks: number; fixtures: number};
  onUploadBackup: (file: File) => Promise<boolean>;
  onFactoryReset: () => void;
}

type StatusEvent =
  | {kind: 'downloaded'; presets: number; banks: number; fixtures: number}
  | {kind: 'restored'}
  | {kind: 'invalid'}
  | {kind: 'reset'}
  | {kind: 'admin-downloaded'; pkgName: string}
  | {kind: 'admin-creds-updated'; username: string}
  | {kind: 'admin-error'; message?: string}
  | null;

const LANGUAGES: AppLanguage[] = ['en', 'pt-PT'];

export function SettingsModal({
  isOpen,
  onClose,
  tabletMode,
  onToggleTabletMode,
  onDownloadBackup,
  onUploadBackup,
  onFactoryReset,
}: SettingsModalProps) {
  const {language, setLanguage, t} = useLanguage();
  const isOnline = useOnlineStatus();
  const isOfflineReady = useOfflineReady();
  const [confirmReset, setConfirmReset] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [statusEvent, setStatusEvent] = useState<StatusEvent>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Administrator session held strictly in React memory (never persisted to localStorage/sessionStorage)
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [adminUser, setAdminUser] = useState<string | null>(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [adminAuthLoading, setAdminAuthLoading] = useState(false);
  const [adminAuthError, setAdminAuthError] = useState<string | null>(null);
  const [downloadingTarget, setDownloadingTarget] = useState<
    'windows' | 'android' | null
  >(null);
  const [isEditingCreds, setIsEditingCreds] = useState(false);
  const [newUsernameInput, setNewUsernameInput] = useState('');
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [credsSaving, setCredsSaving] = useState(false);
  const [credsError, setCredsError] = useState<string | null>(null);

  const isFileProtocol =
    typeof window !== 'undefined' && window.location.protocol === 'file:';

  useEffect(() => {
    if (!isOpen) {
      setConfirmReset(false);
      setStatusEvent(null);
      setAdminAuthError(null);
      setIsEditingCreds(false);
      setCurrentPasswordInput('');
      setNewPasswordInput('');
      setConfirmPasswordInput('');
      setCredsError(null);
      return;
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDownloadClick = () => {
    setConfirmReset(false);
    const counts = onDownloadBackup();
    setStatusEvent({
      kind: 'downloaded',
      presets: counts.presets,
      banks: counts.banks,
      fixtures: counts.fixtures,
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setConfirmReset(false);
    setIsImporting(true);
    try {
      const ok = await onUploadBackup(file);
      setStatusEvent(ok ? {kind: 'restored'} : {kind: 'invalid'});
    } finally {
      setIsImporting(false);
    }
  };

  const handleConfirmReset = () => {
    onFactoryReset();
    setConfirmReset(false);
    setStatusEvent({kind: 'reset'});
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isFileProtocol) {
      setAdminAuthError(t.settingsAdminServerOffline);
      return;
    }
    setAdminAuthLoading(true);
    setAdminAuthError(null);
    setStatusEvent(null);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          username: usernameInput.trim(),
          password: passwordInput,
        }),
      });
      const data = (await res.json()) as {
        token?: string;
        username?: string;
        error?: string;
      };
      if (!res.ok || !data.token) {
        setAdminAuthError(
          res.status === 429 && data.error ? data.error : t.settingsAdminInvalid,
        );
        return;
      }
      setAdminToken(data.token);
      setAdminUser(data.username || usernameInput.trim());
      setPasswordInput('');
    } catch {
      setAdminAuthError(t.settingsAdminServerOffline);
    } finally {
      setAdminAuthLoading(false);
    }
  };

  const handleAdminLock = () => {
    setAdminToken(null);
    setAdminUser(null);
    setPasswordInput('');
    setAdminAuthError(null);
    setIsEditingCreds(false);
    setNewUsernameInput('');
    setCurrentPasswordInput('');
    setNewPasswordInput('');
    setConfirmPasswordInput('');
    setCredsError(null);
  };

  const handleToggleEditCreds = () => {
    if (isEditingCreds) {
      setIsEditingCreds(false);
      setCurrentPasswordInput('');
      setNewPasswordInput('');
      setConfirmPasswordInput('');
      setCredsError(null);
      return;
    }
    setNewUsernameInput(adminUser || '');
    setCurrentPasswordInput('');
    setNewPasswordInput('');
    setConfirmPasswordInput('');
    setCredsError(null);
    setStatusEvent(null);
    setIsEditingCreds(true);
  };

  const handleUpdateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken) return;
    if (isFileProtocol) {
      setCredsError(t.settingsAdminServerOffline);
      return;
    }

    const trimmedUsername = newUsernameInput.trim();
    if (trimmedUsername.length < 2 || trimmedUsername.length > 32) {
      setCredsError(t.settingsAdminUsernameInvalid);
      return;
    }
    if (newPasswordInput.length < 6 || newPasswordInput.length > 128) {
      setCredsError(t.settingsAdminPasswordTooShort);
      return;
    }
    if (newPasswordInput !== confirmPasswordInput) {
      setCredsError(t.settingsAdminPasswordMismatch);
      return;
    }

    setCredsSaving(true);
    setCredsError(null);
    setStatusEvent(null);

    try {
      const res = await fetch('/api/admin/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          currentPassword: currentPasswordInput,
          newUsername: trimmedUsername,
          newPassword: newPasswordInput,
        }),
      });
      const data = (await res.json()) as {
        token?: string;
        username?: string;
        code?: string;
        error?: string;
      };

      if (res.status === 401 && data.code !== 'INVALID_CURRENT_PASSWORD') {
        handleAdminLock();
        setAdminAuthError(t.settingsAdminInvalid);
        return;
      }

      if (!res.ok || !data.token || !data.username) {
        if (data.code === 'INVALID_CURRENT_PASSWORD') {
          setCredsError(t.settingsAdminCurrentPasswordInvalid);
        } else if (data.code === 'INVALID_USERNAME') {
          setCredsError(t.settingsAdminUsernameInvalid);
        } else if (data.code === 'INVALID_PASSWORD') {
          setCredsError(t.settingsAdminPasswordTooShort);
        } else {
          setCredsError(data.error || t.settingsAdminCredsUpdateError);
        }
        return;
      }

      setAdminToken(data.token);
      setAdminUser(data.username);
      setUsernameInput(data.username);
      setIsEditingCreds(false);
      setCurrentPasswordInput('');
      setNewPasswordInput('');
      setConfirmPasswordInput('');
      setStatusEvent({kind: 'admin-creds-updated', username: data.username});
    } catch {
      setCredsError(t.settingsAdminServerOffline);
    } finally {
      setCredsSaving(false);
    }
  };

  const handleDownloadAppPackage = async (target: 'windows' | 'android') => {
    if (!adminToken) return;
    if (isFileProtocol) {
      setStatusEvent({kind: 'admin-error', message: t.settingsAdminServerOffline});
      return;
    }
    setDownloadingTarget(target);
    setStatusEvent(null);
    const filename =
      target === 'windows'
        ? 'LightViana-DMX-Windows.zip'
        : 'LightViana-DMX-Android.zip';
    try {
      const res = await fetch(`/api/admin/download/${target}`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      if (res.status === 401) {
        handleAdminLock();
        setAdminAuthError(t.settingsAdminInvalid);
        return;
      }
      if (!res.ok) {
        throw new Error(t.settingsAdminDownloadError);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      setStatusEvent({kind: 'admin-downloaded', pkgName: filename});
    } catch (err) {
      setStatusEvent({
        kind: 'admin-error',
        message: err instanceof Error ? err.message : t.settingsAdminDownloadError,
      });
    } finally {
      setDownloadingTarget(null);
    }
  };

  const statusText = statusEvent
    ? statusEvent.kind === 'downloaded'
      ? t.settingsBackupDownloaded(
          statusEvent.presets,
          statusEvent.banks,
          statusEvent.fixtures,
        )
      : statusEvent.kind === 'restored'
        ? t.settingsBackupRestored
        : statusEvent.kind === 'reset'
          ? t.settingsResetSuccess
          : statusEvent.kind === 'admin-downloaded'
            ? t.settingsAdminDownloaded(statusEvent.pkgName)
            : statusEvent.kind === 'admin-creds-updated'
              ? t.settingsAdminCredsUpdated(statusEvent.username)
              : statusEvent.kind === 'admin-error'
                ? statusEvent.message || t.settingsAdminDownloadError
                : t.settingsBackupInvalid
    : null;

  const isStatusError =
    statusEvent?.kind === 'invalid' || statusEvent?.kind === 'admin-error';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-white/15 bg-[#101624] p-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-white/8 pb-3.5">
          <div>
            <h2
              id="settings-modal-title"
              className="font-display text-base font-semibold text-white"
            >
              {t.settingsTitle}
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">{t.settingsSubtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.closeModalAria}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-5">
          {/* Language Selection */}
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-white">
              <Globe className="h-3.5 w-3.5 text-sky-400" />
              <span>{t.settingsLanguageLabel}</span>
            </div>
            <p className="mb-3 text-xs text-slate-400">{t.settingsLanguageHint}</p>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {LANGUAGES.map((code) => {
                const selected = language === code;
                const info = LANGUAGE_LABELS[code];
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setLanguage(code)}
                    aria-pressed={selected}
                    className={`flex min-h-[52px] items-center justify-between gap-3 rounded-lg border px-3.5 py-2.5 text-left transition-all ${
                      selected
                        ? 'border-sky-500 bg-sky-500/15 text-white shadow-[0_0_16px_rgba(14,165,233,0.18)]'
                        : 'border-white/10 bg-[#0B101B] text-slate-300 hover:border-white/25 hover:text-white'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white">{info.native}</div>
                      <div className="text-[11px] text-slate-400">{info.subtitle}</div>
                    </div>
                    {selected && <Check className="h-4 w-4 shrink-0 text-sky-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interface & Touch */}
          <div className="border-t border-white/8 pt-4">
            <div className="mb-2.5 flex items-center gap-2 text-xs font-semibold text-white">
              <Tablet className="h-3.5 w-3.5 text-amber-400" />
              <span>{t.settingsInterfaceLabel}</span>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-[#0B101B] px-3.5 py-3">
              <div className="min-w-0">
                <div className="text-xs font-medium text-white">
                  {t.settingsTabletModeLabel}
                </div>
                <div className="mt-0.5 text-[11px] text-slate-400">
                  {t.settingsTabletModeHint}
                </div>
              </div>
              <button
                type="button"
                onClick={onToggleTabletMode}
                aria-pressed={tabletMode}
                className={`min-h-[36px] shrink-0 rounded-lg border px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  tabletMode
                    ? 'border-amber-500 bg-amber-500/20 text-amber-200'
                    : 'border-white/15 bg-[#151D2E] text-slate-300 hover:text-white'
                }`}
              >
                {tabletMode ? t.settingsOn : t.settingsOff}
              </button>
            </div>
          </div>

          {/* Offline Mode & PWA Installation */}
          <div className="border-t border-white/8 pt-4">
            <div className="mb-1 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <WifiOff className="h-3.5 w-3.5 text-emerald-400" />
                <span>{t.settingsOfflineLabel}</span>
              </div>
              <span
                className={`text-[11px] font-medium ${
                  isOnline ? 'text-emerald-400' : 'text-amber-300'
                }`}
              >
                {isOnline
                  ? t.settingsOfflineConnOnline
                  : t.settingsOfflineConnOffline}
              </span>
            </div>
            <p className="mb-3 text-xs text-slate-400">{t.settingsOfflineHint}</p>

            <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-lg border border-white/10 bg-[#0B101B] px-3.5 py-3">
              <span
                className={`text-xs font-medium ${
                  isOfflineReady ? 'text-emerald-300' : 'text-slate-400'
                }`}
              >
                {isOfflineReady
                  ? t.settingsOfflineReady
                  : t.settingsOfflineSyncing}
              </span>
              <PWAInstallButton />
            </div>
          </div>

          {/* Full Backup Download & Upload */}
          <div className="border-t border-white/8 pt-4">
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-white">
              <HardDrive className="h-3.5 w-3.5 text-emerald-400" />
              <span>{t.settingsBackupLabel}</span>
            </div>
            <p className="mb-3 text-xs text-slate-400">{t.settingsBackupHint}</p>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleDownloadClick}
                className="flex min-h-[42px] items-center justify-center gap-2 rounded-lg border border-white/15 bg-[#0B101B] px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:border-sky-500/50 hover:bg-[#151D2E]"
              >
                <Download className="h-4 w-4 shrink-0 text-sky-400" />
                <span>{t.settingsDownloadBackup}</span>
              </button>

              <button
                type="button"
                disabled={isImporting}
                onClick={() => fileInputRef.current?.click()}
                className="flex min-h-[42px] items-center justify-center gap-2 rounded-lg border border-white/15 bg-[#0B101B] px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:border-amber-500/50 hover:bg-[#151D2E] disabled:opacity-50"
              >
                <Upload className="h-4 w-4 shrink-0 text-amber-400" />
                <span>{t.settingsUploadBackup}</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={(e) => void handleFileChange(e)}
                className="hidden"
              />
            </div>
          </div>

          {/* Administrator Mode: Full Windows & Android App Packages */}
          <div className="border-t border-white/8 pt-4">
            <div className="rounded-lg border border-sky-500/25 bg-[#0B101B] p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-sky-400" />
                  <span>{t.settingsAdminLabel}</span>
                </div>

                {adminToken && adminUser && (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded border border-emerald-500/35 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-200">
                      <Unlock className="h-3 w-3" />
                      {t.settingsAdminUnlockedBadge(adminUser)}
                    </span>
                    <button
                      type="button"
                      onClick={handleAdminLock}
                      className="inline-flex items-center gap-1 rounded border border-white/15 bg-[#151D2E] px-2 py-0.5 text-[11px] font-medium text-slate-300 hover:text-white"
                    >
                      <Lock className="h-3 w-3" />
                      <span>{t.settingsAdminLockBtn}</span>
                    </button>
                  </div>
                )}
              </div>

              <p className="mt-1 text-[11px] text-slate-400">{t.settingsAdminHint}</p>

              {!adminToken ? (
                <form
                  onSubmit={(e) => void handleAdminLogin(e)}
                  className="mt-3 space-y-2.5"
                >
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="admin-username"
                        className="mb-1 block text-[11px] font-medium text-slate-300"
                      >
                        {t.settingsAdminUsernameLabel}
                      </label>
                      <input
                        id="admin-username"
                        type="text"
                        autoComplete="username"
                        value={usernameInput}
                        onChange={(e) => setUsernameInput(e.target.value)}
                        required
                        className="h-9 w-full rounded-lg border border-white/10 bg-[#101624] px-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="admin-password"
                        className="mb-1 block text-[11px] font-medium text-slate-300"
                      >
                        {t.settingsAdminPasswordLabel}
                      </label>
                      <input
                        id="admin-password"
                        type="password"
                        autoComplete="current-password"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        required
                        className="h-9 w-full rounded-lg border border-white/10 bg-[#101624] px-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {adminAuthError && (
                    <div className="rounded border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-[11px] text-rose-200">
                      {adminAuthError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={adminAuthLoading}
                    className="flex min-h-[38px] w-full items-center justify-center gap-2 rounded-lg border border-sky-500/40 bg-sky-500/15 px-3.5 py-1.5 text-xs font-semibold text-sky-200 transition-colors hover:bg-sky-500/25 disabled:opacity-50"
                  >
                    {adminAuthLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Lock className="h-3.5 w-3.5" />
                    )}
                    <span>{t.settingsAdminUnlockBtn}</span>
                  </button>
                </form>
              ) : (
                <div className="mt-3 space-y-3">
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <button
                      type="button"
                      disabled={downloadingTarget !== null}
                      onClick={() => void handleDownloadAppPackage('windows')}
                      className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-sky-500/45 bg-sky-500/15 px-3.5 py-2 text-xs font-semibold text-sky-100 transition-colors hover:bg-sky-500/25 disabled:opacity-50"
                    >
                      {downloadingTarget === 'windows' ? (
                        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-sky-300" />
                      ) : (
                        <Laptop className="h-4 w-4 shrink-0 text-sky-300" />
                      )}
                      <span>{t.settingsAdminDownloadWindows}</span>
                    </button>

                    <button
                      type="button"
                      disabled={downloadingTarget !== null}
                      onClick={() => void handleDownloadAppPackage('android')}
                      className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-emerald-500/45 bg-emerald-500/15 px-3.5 py-2 text-xs font-semibold text-emerald-100 transition-colors hover:bg-emerald-500/25 disabled:opacity-50"
                    >
                      {downloadingTarget === 'android' ? (
                        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-emerald-300" />
                      ) : (
                        <Smartphone className="h-4 w-4 shrink-0 text-emerald-300" />
                      )}
                      <span>{t.settingsAdminDownloadAndroid}</span>
                    </button>
                  </div>

                  <p className="text-[11px] leading-relaxed text-slate-400">
                    {t.settingsAdminPackageHint}
                  </p>

                  <div className="border-t border-white/8 pt-2.5">
                    <button
                      type="button"
                      onClick={handleToggleEditCreds}
                      aria-expanded={isEditingCreds}
                      className={`flex min-h-[38px] w-full items-center justify-center gap-2 rounded-lg border px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                        isEditingCreds
                          ? 'border-sky-500/50 bg-sky-500/15 text-sky-100'
                          : 'border-white/15 bg-[#151D2E] text-slate-200 hover:border-sky-500/40 hover:text-white'
                      }`}
                    >
                      <KeyRound className="h-3.5 w-3.5 shrink-0 text-sky-400" />
                      <span>{t.settingsAdminChangeCredsBtn}</span>
                    </button>

                    {isEditingCreds && (
                      <form
                        onSubmit={(e) => void handleUpdateCredentials(e)}
                        className="mt-2.5 space-y-2.5 rounded-lg border border-white/10 bg-[#101624] p-3"
                      >
                        <div className="text-xs font-semibold text-white">
                          {t.settingsAdminChangeCredsTitle}
                        </div>

                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <div>
                            <label
                              htmlFor="admin-new-username"
                              className="mb-1 block text-[11px] font-medium text-slate-300"
                            >
                              {t.settingsAdminNewUsernameLabel}
                            </label>
                            <input
                              id="admin-new-username"
                              type="text"
                              autoComplete="username"
                              value={newUsernameInput}
                              onChange={(e) => setNewUsernameInput(e.target.value)}
                              required
                              minLength={2}
                              maxLength={32}
                              className="h-9 w-full rounded-lg border border-white/10 bg-[#0B101B] px-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label
                              htmlFor="admin-current-password"
                              className="mb-1 block text-[11px] font-medium text-slate-300"
                            >
                              {t.settingsAdminCurrentPasswordLabel}
                            </label>
                            <input
                              id="admin-current-password"
                              type="password"
                              autoComplete="current-password"
                              value={currentPasswordInput}
                              onChange={(e) => setCurrentPasswordInput(e.target.value)}
                              required
                              className="h-9 w-full rounded-lg border border-white/10 bg-[#0B101B] px-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label
                              htmlFor="admin-new-password"
                              className="mb-1 block text-[11px] font-medium text-slate-300"
                            >
                              {t.settingsAdminNewPasswordLabel}
                            </label>
                            <input
                              id="admin-new-password"
                              type="password"
                              autoComplete="new-password"
                              value={newPasswordInput}
                              onChange={(e) => setNewPasswordInput(e.target.value)}
                              required
                              minLength={6}
                              maxLength={128}
                              className="h-9 w-full rounded-lg border border-white/10 bg-[#0B101B] px-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label
                              htmlFor="admin-confirm-password"
                              className="mb-1 block text-[11px] font-medium text-slate-300"
                            >
                              {t.settingsAdminConfirmPasswordLabel}
                            </label>
                            <input
                              id="admin-confirm-password"
                              type="password"
                              autoComplete="new-password"
                              value={confirmPasswordInput}
                              onChange={(e) => setConfirmPasswordInput(e.target.value)}
                              required
                              minLength={6}
                              maxLength={128}
                              className="h-9 w-full rounded-lg border border-white/10 bg-[#0B101B] px-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                            />
                          </div>
                        </div>

                        {credsError && (
                          <div className="rounded border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-[11px] text-rose-200">
                            {credsError}
                          </div>
                        )}

                        <div className="flex flex-wrap items-center justify-end gap-2 pt-0.5">
                          <button
                            type="button"
                            onClick={handleToggleEditCreds}
                            disabled={credsSaving}
                            className="min-h-[36px] rounded-lg border border-white/15 bg-[#151D2E] px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white whitespace-nowrap disabled:opacity-50"
                          >
                            {t.settingsAdminCancelCredsBtn}
                          </button>
                          <button
                            type="submit"
                            disabled={credsSaving}
                            className="inline-flex min-h-[36px] items-center justify-center gap-1.5 rounded-lg bg-sky-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950 transition-colors hover:bg-sky-400 whitespace-nowrap disabled:opacity-50"
                          >
                            {credsSaving && (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            )}
                            <span>{t.settingsAdminSaveCredsBtn}</span>
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Factory Reset */}
          <div className="border-t border-white/8 pt-4">
            <div className="rounded-lg border border-rose-500/25 bg-rose-500/5 p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-200">
                    <RotateCcw className="h-3.5 w-3.5 shrink-0 text-rose-400" />
                    <span>{t.settingsResetLabel}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">{t.settingsResetHint}</p>
                </div>

                {!confirmReset && (
                  <button
                    type="button"
                    onClick={() => {
                      setStatusEvent(null);
                      setConfirmReset(true);
                    }}
                    className="min-h-[38px] shrink-0 rounded-lg border border-rose-500/40 bg-rose-500/15 px-3.5 py-1.5 text-xs font-semibold text-rose-200 transition-colors hover:bg-rose-500/25 whitespace-nowrap"
                  >
                    {t.settingsResetBtn}
                  </button>
                )}
              </div>

              {confirmReset && (
                <div className="mt-3 border-t border-rose-500/20 pt-3">
                  <div className="flex items-start gap-2 text-xs text-rose-200">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                    <span>{t.settingsResetConfirmPrompt}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmReset(false)}
                      className="min-h-[36px] rounded-lg border border-white/15 bg-[#151D2E] px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white"
                    >
                      {t.settingsResetCancelBtn}
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmReset}
                      className="min-h-[36px] rounded-lg bg-rose-500 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-rose-400"
                    >
                      {t.settingsResetConfirmBtn}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Feedback Banner */}
          {statusText && (
            <div
              role="status"
              className={`rounded-lg border px-3.5 py-2.5 text-xs font-medium ${
                isStatusError
                  ? 'border-rose-500/35 bg-rose-500/10 text-rose-200'
                  : 'border-emerald-500/35 bg-emerald-500/10 text-emerald-200'
              }`}
            >
              {statusText}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-5 flex justify-end border-t border-white/8 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] rounded-lg bg-sky-500 px-5 py-2 text-xs font-semibold text-slate-950 transition-colors hover:bg-sky-400"
          >
            {t.settingsDone}
          </button>
        </div>
      </div>
    </div>
  );
}
