import {useCallback, useEffect, useState} from 'react';
import {Check, Copy, Download, Globe, Laptop, Radio, RefreshCw, Tablet, Wifi} from 'lucide-react';
import {ConnectedDevice, SyncStatus} from '../hooks/useRealtimeSync';
import {useOnlineStatus} from '../hooks/usePWAInstall';
import {PWAInstallButton} from './PWAInstallButton';
import {useLanguage} from '../i18n/LanguageContext';
import {AppLanguage, LANGUAGE_LABELS} from '../i18n/translations';

interface NetworkInfoResponse {
  hostname: string;
  platform: string;
  port: number;
  lanIps: Array<{name: string; address: string}>;
  tabletUrl: string;
  qrSvg: string;
}

interface ArtNetConfigResponse {
  enabled: boolean;
  targetIp: string;
  universe: number;
  roomId: string;
  packetsSent: number;
  lastError: string | null;
}

interface NetworkRemoteViewProps {
  roomId: string;
  onChangeRoomId: (next: string) => void;
  deviceName: string;
  onChangeDeviceName: (next: string) => void;
  deviceRole: 'windows' | 'android' | 'web';
  onChangeDeviceRole: (role: 'windows' | 'android' | 'web') => void;
  syncStatus: SyncStatus;
  devices: ConnectedDevice[];
  selfId: string | null;
  tabletMode: boolean;
  onToggleTabletMode: () => void;
}

export function NetworkRemoteView({
  roomId,
  onChangeRoomId,
  deviceName,
  onChangeDeviceName,
  deviceRole,
  onChangeDeviceRole,
  syncStatus,
  devices,
  selfId,
  tabletMode,
  onToggleTabletMode,
}: NetworkRemoteViewProps) {
  const {t, language, setLanguage} = useLanguage();
  const isOnline = useOnlineStatus();
  const [netInfo, setNetInfo] = useState<NetworkInfoResponse | null>(null);
  const [artNet, setArtNet] = useState<ArtNetConfigResponse | null>(null);
  const [targetIpInput, setTargetIpInput] = useState('255.255.255.255');
  const [universeInput, setUniverseInput] = useState(0);
  const [roomInput, setRoomInput] = useState(roomId);
  const [copied, setCopied] = useState(false);

  const isFileProtocol =
    typeof window !== 'undefined' && window.location.protocol === 'file:';

  const fetchNetworkInfo = useCallback(async () => {
    if (isFileProtocol || !isOnline) return;
    try {
      const res = await fetch(`/api/network-info?room=${encodeURIComponent(roomId)}`);
      if (res.ok) {
        const data = (await res.json()) as NetworkInfoResponse;
        setNetInfo(data);
      }
    } catch {
      // Ignore transient network errors
    }
  }, [isFileProtocol, isOnline, roomId]);

  const fetchArtNet = useCallback(async () => {
    if (isFileProtocol || !isOnline) return;
    try {
      const res = await fetch('/api/artnet/config');
      if (res.ok) {
        const data = (await res.json()) as ArtNetConfigResponse;
        setArtNet(data);
        setTargetIpInput(data.targetIp);
        setUniverseInput(data.universe);
      }
    } catch {
      // Ignore
    }
  }, [isFileProtocol, isOnline]);

  useEffect(() => {
    if (isFileProtocol || !isOnline) return;
    void fetchNetworkInfo();
    void fetchArtNet();
  }, [isFileProtocol, isOnline, fetchNetworkInfo, fetchArtNet]);

  // Poll Art-Net packet counter when Art-Net is enabled
  useEffect(() => {
    if (isFileProtocol || !isOnline || !artNet?.enabled) return;
    const id = window.setInterval(() => {
      void fetchArtNet();
    }, 1000);
    return () => window.clearInterval(id);
  }, [isFileProtocol, isOnline, artNet?.enabled, fetchArtNet]);

  const updateArtNet = async (patch: Partial<ArtNetConfigResponse>) => {
    if (isFileProtocol) return;
    try {
      const res = await fetch('/api/artnet/config', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({...patch, roomId}),
      });
      if (res.ok) {
        const data = (await res.json()) as ArtNetConfigResponse;
        setArtNet(data);
      }
    } catch {
      // Ignore
    }
  };

  const handleCopyUrl = async () => {
    if (!netInfo?.tabletUrl) return;
    try {
      await navigator.clipboard.writeText(netInfo.tabletUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Ignore clipboard failures
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      {/* Left: Wi-Fi Pairing & QR Code for Android Tablet */}
      <section className="rounded-xl border border-white/10 bg-[#101624] p-4 lg:col-span-7">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/8 pb-3">
          <div>
            <h2 className="font-display text-base font-semibold text-white">
              {t.wifiPairingTitle}
            </h2>
            <p className="text-xs text-slate-400">
              {t.wifiPairingSubtitle}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span
              className={`font-medium ${
                syncStatus === 'connected'
                  ? 'text-emerald-400'
                  : syncStatus === 'connecting'
                    ? 'text-sky-400'
                    : syncStatus === 'standalone'
                      ? 'text-slate-300'
                      : 'text-amber-400'
              }`}
            >
              {syncStatus === 'connected'
                ? t.syncConnected
                : syncStatus === 'connecting'
                  ? t.syncConnecting
                  : syncStatus === 'standalone'
                    ? t.syncStandalone
                    : t.syncReconnecting}
            </span>
            <button
              type="button"
              onClick={() => void fetchNetworkInfo()}
              aria-label={t.refreshWifiAria}
              className="rounded-lg border border-white/10 bg-[#151D2E] p-2 text-slate-300 hover:text-white"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {isFileProtocol && (
          <div className="mb-4 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3.5 py-2.5 text-xs leading-relaxed text-sky-100">
            {t.standaloneNetworkNotice}
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
          {/* QR Code Box */}
          <div className="flex flex-col items-center justify-center rounded-xl border border-white/8 bg-[#090C12] p-4 md:col-span-5">
            {netInfo?.qrSvg ? (
              <div className="overflow-hidden rounded-lg bg-[#090C12]">
                <img
                  src={`data:image/svg+xml;utf8,${encodeURIComponent(netInfo.qrSvg)}`}
                  alt={t.scanQrHint}
                  className="h-[220px] w-[220px] block"
                />
              </div>
            ) : (
              <div className="flex h-44 w-44 items-center justify-center text-xs text-slate-500">
                {isFileProtocol ? t.syncStandalone : t.generatingQr}
              </div>
            )}
            <p className="mt-2.5 text-center text-xs text-slate-300">
              {t.scanQrHint}
            </p>
          </div>

          {/* Wi-Fi URL, Room & Connected Devices */}
          <div className="flex flex-col justify-between gap-4 md:col-span-7">
            <div className="space-y-3">
              <div>
                <div className="mb-1 text-xs font-medium text-slate-300">
                  {t.tabletUrlLabel}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={netInfo?.tabletUrl || t.detectingIp}
                    aria-label={t.tabletUrlLabel}
                    className="font-mono-tabular h-10 flex-1 rounded-lg border border-white/10 bg-[#0B101B] px-3 text-xs text-sky-300 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => void handleCopyUrl()}
                    className="flex min-h-[40px] items-center gap-1.5 rounded-lg border border-white/10 bg-[#151D2E] px-3 text-xs font-medium text-white hover:border-sky-500/40 whitespace-nowrap shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span>{t.copiedBtn}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-slate-300" />
                        <span>{t.copyBtn}</span>
                      </>
                    )}
                  </button>
                </div>
                {netInfo && netInfo.lanIps.length > 0 && (
                  <div className="mt-1.5 text-[11px] text-slate-400 font-mono-tabular">
                    {t.detectedLanIps}{' '}
                    {netInfo.lanIps.map((i) => `${i.address} (${i.name})`).join(' · ')}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <div>
                  <label htmlFor="sync-room-id" className="mb-1 block text-xs text-slate-300">
                    {t.roomCodeLabel}
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      id="sync-room-id"
                      type="text"
                      value={roomInput}
                      onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
                      className="font-mono-tabular h-9 w-full rounded-lg border border-white/10 bg-[#0B101B] px-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => onChangeRoomId(roomInput.trim() || 'MAIN-SHOW')}
                      className="rounded-lg bg-sky-500 px-3 text-xs font-semibold text-slate-950 hover:bg-sky-400 whitespace-nowrap shrink-0"
                    >
                      {t.joinBtn}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="device-name-input" className="mb-1 block text-xs text-slate-300">
                    {t.deviceNameLabel}
                  </label>
                  <input
                    id="device-name-input"
                    type="text"
                    value={deviceName}
                    onChange={(e) => onChangeDeviceName(e.target.value)}
                    className="h-9 w-full rounded-lg border border-white/10 bg-[#0B101B] px-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-1 rounded-lg bg-[#0B101B] p-1">
                  {(['windows', 'android', 'web'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => onChangeDeviceRole(r)}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                        deviceRole === r
                          ? 'bg-slate-800 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {r === 'windows' ? t.roleWindows : r === 'android' ? t.roleAndroid : t.roleWeb}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={onToggleTabletMode}
                  className={`min-h-[36px] rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                    tabletMode
                      ? 'border-amber-500 bg-amber-500/20 text-amber-200'
                      : 'border-white/10 bg-[#151D2E] text-slate-300 hover:text-white'
                  }`}
                >
                  {tabletMode ? t.tabletModeOn : t.tabletModeOff}
                </button>
              </div>
            </div>

            {/* Connected Devices Presence List */}
            <div className="rounded-lg border border-white/8 bg-[#0B101B] p-3">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="font-semibold text-white">{t.connectedDevicesIn(roomId)}</span>
                <span className="font-mono-tabular text-slate-400">{t.onlineCount(devices.length)}</span>
              </div>
              {devices.length === 0 ? (
                <p className="text-xs text-slate-500">{t.waitingDevices}</p>
              ) : (
                <ul className="space-y-1.5 text-xs">
                  {devices.map((d) => (
                    <li
                      key={d.id}
                      className="flex items-center justify-between rounded bg-[#151D2E] px-2.5 py-1.5"
                    >
                      <div className="flex items-center gap-2 text-slate-200">
                        {d.role === 'android' ? (
                          <Tablet className="h-3.5 w-3.5 text-amber-400" />
                        ) : d.role === 'windows' ? (
                          <Laptop className="h-3.5 w-3.5 text-sky-400" />
                        ) : (
                          <Wifi className="h-3.5 w-3.5 text-slate-400" />
                        )}
                        <span className="font-medium">{d.name}</span>
                        {d.id === selfId && (
                          <span className="text-[11px] text-sky-400">{t.thisDeviceTag}</span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {d.role === 'windows'
                          ? t.roleWindows
                          : d.role === 'android'
                            ? t.roleAndroid
                            : t.roleWeb}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Right: Application Language + Windows Host Art-Net DMX + App Install & Launcher */}
      <div className="space-y-4 lg:col-span-5">
        {/* Application Settings (Language Selector) */}
        <section className="rounded-xl border border-white/10 bg-[#101624] p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-sky-400" />
            <div>
              <h2 className="font-display text-base font-semibold text-white">
                {t.netSettingsCardTitle}
              </h2>
              <p className="text-xs text-slate-400">{t.netSettingsCardSubtitle}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {(['en', 'pt-PT'] as AppLanguage[]).map((langCode) => {
              const selected = language === langCode;
              const labelInfo = LANGUAGE_LABELS[langCode];
              return (
                <button
                  key={langCode}
                  type="button"
                  onClick={() => setLanguage(langCode)}
                  className={`flex min-h-[46px] items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left transition-colors ${
                    selected
                      ? 'border-sky-500 bg-sky-500/15 text-white'
                      : 'border-white/10 bg-[#0B101B] text-slate-300 hover:border-white/25 hover:text-white'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-white">{labelInfo.native}</div>
                    <div className="text-[11px] text-slate-400">{labelInfo.subtitle}</div>
                  </div>
                  {selected && <Check className="h-3.5 w-3.5 text-sky-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </section>

        {/* Art-Net UDP DMX Output */}
        <section className="rounded-xl border border-white/10 bg-[#101624] p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-base font-semibold text-white">
                {t.artNetTitle}
              </h2>
              <p className="text-xs text-slate-400">
                {t.artNetSubtitle}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void updateArtNet({enabled: !artNet?.enabled})}
              className={`flex min-h-[38px] items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                artNet?.enabled
                  ? 'border-emerald-500/60 bg-emerald-500/20 text-emerald-200'
                  : 'border-white/10 bg-[#151D2E] text-slate-300 hover:text-white'
              }`}
            >
              <Radio className="h-3.5 w-3.5" />
              <span>{artNet?.enabled ? t.artNetTransmitting : t.artNetDisabled}</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div className="col-span-2">
              <label htmlFor="artnet-ip" className="mb-1 block text-xs text-slate-300">
                {t.artNetIpLabel}
              </label>
              <input
                id="artnet-ip"
                type="text"
                value={targetIpInput}
                onChange={(e) => setTargetIpInput(e.target.value)}
                className="font-mono-tabular h-9 w-full rounded-lg border border-white/10 bg-[#0B101B] px-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="artnet-uni" className="mb-1 block text-xs text-slate-300">
                {t.artNetUniLabel}
              </label>
              <input
                id="artnet-uni"
                type="number"
                min={0}
                max={15}
                value={universeInput}
                onChange={(e) => setUniverseInput(Number(e.target.value) || 0)}
                className="font-mono-tabular h-9 w-full rounded-lg border border-white/10 bg-[#0B101B] px-2.5 text-xs text-sky-300 focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="font-mono-tabular text-xs text-slate-400">
              {t.artNetPacketsSent(artNet?.packetsSent ?? 0)}
            </span>
            <button
              type="button"
              onClick={() =>
                void updateArtNet({
                  targetIp: targetIpInput,
                  universe: universeInput,
                })
              }
              className="rounded-lg border border-white/15 bg-[#151D2E] px-3 py-1.5 text-xs font-medium text-white hover:border-sky-500/50"
            >
              {t.artNetApplyBtn}
            </button>
          </div>

          {artNet?.lastError && (
            <p className="mt-2.5 rounded border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-xs text-rose-200">
              {artNet.lastError}
            </p>
          )}
        </section>

        {/* Windows Installer & PWA Card */}
        <section className="rounded-xl border border-white/10 bg-[#101624] p-4 space-y-3.5">
          <div>
            <h2 className="font-display text-base font-semibold text-white">
              {t.installTitle}
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              {t.installSubtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <PWAInstallButton />
            <a
              href="/api/windows-launcher"
              download="Start-LightViana-Windows.bat"
              className="flex min-h-[40px] items-center gap-2 rounded-lg border border-white/15 bg-[#151D2E] px-3.5 py-2 text-xs font-medium text-slate-200 hover:border-sky-500/40 hover:text-white"
            >
              <Download className="h-4 w-4 text-amber-400" />
              <span>{t.downloadBatBtn}</span>
            </a>
          </div>

          <div className="rounded-lg border border-white/8 bg-[#0B101B] p-3 text-xs leading-relaxed text-slate-300 space-y-1">
            <div>
              {t.installStep1Before}{' '}
              <code className="font-mono-tabular text-sky-300">Start-LightViana-Windows.bat</code>{' '}
              {t.installStep1After}
            </div>
            <div>{t.installStep2}</div>
            <div>
              {t.installStep3Before} <strong>{t.installStep3Strong}</strong>{' '}
              {t.installStep3After}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
