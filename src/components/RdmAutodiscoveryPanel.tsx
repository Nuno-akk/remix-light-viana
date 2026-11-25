import {useEffect, useMemo, useState} from 'react';
import {
  AlertTriangle,
  Check,
  Lightbulb,
  Plus,
  Radar,
  RefreshCw,
  Terminal,
  Usb,
} from 'lucide-react';
import {
  buildRdmPacket,
  convertRdmDevicesToFixtures,
  decodeRdmAsciiString,
  mapRdmCategoryToFixture,
  parseRdmDeviceInfo,
  parseRdmFrame,
  RDM_BROADCAST_UID,
  RDM_COMMAND_CLASS,
  RDM_PID,
  RdmDiscoveredDevice,
  RdmDiscoveryResult,
  RdmNodeInfo,
  RdmProtocolLogEntry,
} from '../engine/rdmDiscovery';
import {Fixture} from '../types/dmx';
import {useLanguage} from '../i18n/LanguageContext';

interface RdmAutodiscoveryPanelProps {
  fixtures: Fixture[];
  onAddFixtures: (newFixtures: Fixture[]) => void;
}

export function RdmAutodiscoveryPanel({
  fixtures,
  onAddFixtures,
}: RdmAutodiscoveryPanelProps) {
  const {t, language} = useLanguage();
  const [targetIp, setTargetIp] = useState('255.255.255.255');
  const [universe, setUniverse] = useState(0);
  const [flushTod, setFlushTod] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [autoResolveConflicts, setAutoResolveConflicts] = useState(true);
  const [showLog, setShowLog] = useState(false);

  const [nodesFound, setNodesFound] = useState<RdmNodeInfo[]>([]);
  const [discovered, setDiscovered] = useState<RdmDiscoveredDevice[]>([]);
  const [protocolLog, setProtocolLog] = useState<RdmProtocolLogEntry[]>([]);
  const [lastElapsedMs, setLastElapsedMs] = useState<number | null>(null);
  const [lastTransport, setLastTransport] = useState<string | null>(null);

  const isFileProtocol =
    typeof window !== 'undefined' && window.location.protocol === 'file:';

  // Sync initial Art-Net IP/Universe from server config if available
  useEffect(() => {
    if (isFileProtocol) return;
    let cancelled = false;
    fetch('/api/artnet/config')
      .then((r) => (r.ok ? r.json() : null))
      .then((cfg: {targetIp?: string; universe?: number} | null) => {
        if (cancelled || !cfg) return;
        if (typeof cfg.targetIp === 'string' && cfg.targetIp.trim()) {
          setTargetIp(cfg.targetIp.trim());
        }
        if (typeof cfg.universe === 'number') {
          setUniverse(cfg.universe);
        }
      })
      .catch(() => {
        // Ignore if offline
      });
    return () => {
      cancelled = true;
    };
  }, [isFileProtocol]);

  const patchedUids = useMemo(() => {
    const set = new Set<string>();
    fixtures.forEach((f) => {
      if (f.rdmUid) set.add(f.rdmUid.toUpperCase());
    });
    return set;
  }, [fixtures]);

  const occupiedChannels = useMemo(() => {
    const map = new Map<number, Fixture>();
    fixtures.forEach((f) => {
      for (let ch = f.dmxStart; ch < f.dmxStart + f.channelCount && ch <= 512; ch += 1) {
        map.set(ch, f);
      }
    });
    return map;
  }, [fixtures]);

  const hasAddressConflict = (dev: RdmDiscoveredDevice): boolean => {
    for (let i = 0; i < dev.dmxFootprint; i += 1) {
      const owner = occupiedChannels.get(dev.dmxStartAddress + i);
      if (owner && owner.rdmUid?.toUpperCase() !== dev.uid.toUpperCase()) {
        return true;
      }
    }
    return false;
  };

  const handleArtNetDiscover = async () => {
    if (isFileProtocol) {
      setScanError(t.rdmServerRequiredNotice);
      return;
    }
    setIsScanning(true);
    setScanError(null);
    setNotice(null);
    try {
      const resp = await fetch('/api/rdm/discover', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          targetIp: targetIp.trim() || '255.255.255.255',
          universe,
          flushTod,
          timeoutMs: 1200,
        }),
      });
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }
      const data = (await resp.json()) as RdmDiscoveryResult;
      setNodesFound(data.nodesFound || []);
      setDiscovered(data.devices || []);
      setProtocolLog(data.protocolLog || []);
      setLastElapsedMs(data.elapsedMs);
      setLastTransport('Art-Net / Art-RDM (UDP 6454)');
      if (data.devices.length === 0) {
        setShowLog(true);
      }
    } catch (err) {
      setScanError(
        err instanceof Error ? err.message : t.rdmEmptyResponded,
      );
    } finally {
      setIsScanning(false);
    }
  };

  const handleWebSerialDiscover = async () => {
    setScanError(null);
    setNotice(null);
    const nav = navigator as unknown as {
      serial?: {
        requestPort: () => Promise<{
          open: (opts: {
            baudRate: number;
            dataBits?: number;
            stopBits?: number;
            parity?: 'none';
          }) => Promise<void>;
          close: () => Promise<void>;
          writable: WritableStream<Uint8Array> | null;
          readable: ReadableStream<Uint8Array> | null;
        }>;
      };
    };

    if (!nav.serial) {
      setScanError(t.rdmSerialUnsupportedErr);
      return;
    }

    setIsScanning(true);
    const logs: RdmProtocolLogEntry[] = [];
    const addLog = (
      direction: RdmProtocolLogEntry['direction'],
      summary: string,
    ) => {
      logs.push({
        id: `ser-${logs.length}-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(
          language === 'pt-PT' ? 'pt-PT' : 'en-US',
          {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          },
        ),
        direction,
        protocol: 'Serial-RDM',
        summary,
      });
    };

    const startedAt = Date.now();
    try {
      const port = await nav.serial.requestPort();
      await port.open({
        baudRate: 250000,
        dataBits: 8,
        stopBits: 2,
        parity: 'none',
      });

      const writer = port.writable?.getWriter();
      const reader = port.readable?.getReader();

      if (writer) {
        // Send ANSI E1.20 DISC_UN_MUTE followed by DISC_UNIQUE_BRANCH broadcast
        const unmutePkt = buildRdmPacket({
          destUid: RDM_BROADCAST_UID,
          transactionNumber: 1,
          commandClass: RDM_COMMAND_CLASS.DISCOVERY_COMMAND,
          pid: RDM_PID.DISC_UN_MUTE,
          includeStartCode: true,
        });
        await writer.write(unmutePkt);
        addLog('TX', `DISC_UN_MUTE broadcast (${unmutePkt.length} bytes @ 250 kbps)`);

        const branchData = new Uint8Array(12);
        branchData.fill(0x00, 0, 6); // Lower bound 0000:00000000
        branchData.fill(0xff, 6, 12); // Upper bound FFFF:FFFFFFFF
        const dubPkt = buildRdmPacket({
          destUid: RDM_BROADCAST_UID,
          transactionNumber: 2,
          commandClass: RDM_COMMAND_CLASS.DISCOVERY_COMMAND,
          pid: RDM_PID.DISC_UNIQUE_BRANCH,
          data: branchData,
          includeStartCode: true,
        });
        await writer.write(dubPkt);
        addLog('TX', `DISC_UNIQUE_BRANCH [0000:00000000..FFFF:FFFFFFFF]`);
        writer.releaseLock();
      }

      const foundDevices: RdmDiscoveredDevice[] = [];
      if (reader) {
        const deadline = Date.now() + 700;
        const chunks: number[] = [];
        while (Date.now() < deadline) {
          const readResult = await Promise.race([
            reader.read(),
            new Promise<{value: undefined; done: true}>((resolve) =>
              setTimeout(() => resolve({value: undefined, done: true}), 250),
            ),
          ]);
          if (readResult.value) {
            for (const b of readResult.value) chunks.push(b);
          }
          if (readResult.done) break;
        }
        reader.releaseLock();

        if (chunks.length >= 26) {
          const parsed = parseRdmFrame(new Uint8Array(chunks), true);
          if (parsed && parsed.checksumValid && parsed.pid === RDM_PID.DEVICE_INFO) {
            const info = parseRdmDeviceInfo(parsed.data);
            if (info) {
              const cat = mapRdmCategoryToFixture(info.productCategory);
              foundDevices.push({
                uid: parsed.sourceUid,
                manufacturerId: parseInt(parsed.sourceUid.slice(0, 4), 16) || 0,
                manufacturerLabel: `Mfg 0x${parsed.sourceUid.slice(0, 4)}`,
                modelId: info.modelId,
                modelDescription: decodeRdmAsciiString(parsed.data) || 'USB-RDM Fixture',
                deviceLabel: '',
                productCategory: info.productCategory,
                productCategoryName: cat.categoryName,
                dmxFootprint: info.dmxFootprint,
                dmxStartAddress: info.dmxStartAddress,
                currentPersonality: info.currentPersonality,
                personalityCount: info.personalityCount,
                softwareVersion: info.softwareVersion,
                suggestedType: cat.type,
                suggestedGroup: cat.group,
                identifying: false,
              });
            }
          }
          addLog('RX', `RS-485 RX ${chunks.length}B`);
        } else {
          addLog(
            'INFO',
            'RS-485 250kbps opened without bidirectional RDM reply.',
          );
        }
      }

      await port.close();
      setNodesFound([]);
      setDiscovered(foundDevices);
      setProtocolLog(logs);
      setLastElapsedMs(Date.now() - startedAt);
      setLastTransport('USB-DMX / Serial RS-485');
      setShowLog(true);
    } catch (err) {
      setScanError(
        err instanceof Error ? err.message : t.rdmSerialCancelErr,
      );
    } finally {
      setIsScanning(false);
    }
  };

  const handleToggleIdentify = async (dev: RdmDiscoveredDevice) => {
    const nextActive = !dev.identifying;
    setDiscovered((prev) =>
      prev.map((d) => (d.uid === dev.uid ? {...d, identifying: nextActive} : d)),
    );
    if (isFileProtocol) return;
    try {
      await fetch('/api/rdm/identify', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          targetIp: dev.sourceNodeIp || targetIp,
          universe: dev.sourceUniverse ?? universe,
          uid: dev.uid,
          active: nextActive,
        }),
      });
    } catch {
      // Revert silently on network error
    }
  };

  const handleRemoteSetAddress = async (
    dev: RdmDiscoveredDevice,
    nextAddr: number,
  ) => {
    const clamped = Math.max(1, Math.min(512, nextAddr));
    setDiscovered((prev) =>
      prev.map((d) => (d.uid === dev.uid ? {...d, dmxStartAddress: clamped} : d)),
    );
    if (isFileProtocol) return;
    try {
      const resp = await fetch('/api/rdm/set-address', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          targetIp: dev.sourceNodeIp || targetIp,
          universe: dev.sourceUniverse ?? universe,
          uid: dev.uid,
          startAddress: clamped,
        }),
      });
      if (resp.ok) {
        setNotice(
          t.rdmNoticeSetAddr(String(clamped).padStart(3, '0'), dev.uid),
        );
      }
    } catch {
      // Ignore network error
    }
  };

  const handleImportSingle = (dev: RdmDiscoveredDevice) => {
    const created = convertRdmDevicesToFixtures([dev], fixtures, {
      autoResolveConflicts,
    });
    if (created.length === 0) return;
    onAddFixtures(created);
    setNotice(
      t.rdmNoticeAdded(
        created[0].name,
        dev.uid,
        String(created[0].dmxStart).padStart(3, '0'),
      ),
    );
  };

  const unpatchedDevices = discovered.filter(
    (d) => !patchedUids.has(d.uid.toUpperCase()),
  );

  const handleImportAll = () => {
    const targetList = unpatchedDevices.length > 0 ? unpatchedDevices : discovered;
    if (targetList.length === 0) return;
    const created = convertRdmDevicesToFixtures(targetList, fixtures, {
      autoResolveConflicts,
    });
    onAddFixtures(created);
    setNotice(t.rdmNoticePatchedMulti(created.length));
  };

  return (
    <section className="rounded-xl border border-white/10 bg-[#101624] p-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Radar className="h-4 w-4 text-sky-400" />
            <h2 className="font-display text-base font-semibold text-white">
              {t.rdmTitle}
            </h2>
          </div>
          <p className="mt-0.5 text-xs text-slate-400">
            {t.rdmSubtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#0B101B] px-2.5 py-1">
            <label htmlFor="rdm-target-ip" className="text-[11px] text-slate-400">
              {t.rdmArtNetIp}
            </label>
            <input
              id="rdm-target-ip"
              type="text"
              value={targetIp}
              onChange={(e) => setTargetIp(e.target.value)}
              placeholder="255.255.255.255"
              className="font-mono-tabular w-32 bg-transparent text-xs text-white focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#0B101B] px-2.5 py-1">
            <label htmlFor="rdm-universe" className="text-[11px] text-slate-400">
              {t.rdmUni}
            </label>
            <input
              id="rdm-universe"
              type="number"
              min={0}
              max={15}
              value={universe}
              onChange={(e) =>
                setUniverse(Math.max(0, Math.min(15, Number(e.target.value) || 0)))
              }
              className="font-mono-tabular w-10 bg-transparent text-xs text-sky-300 focus:outline-none"
            />
          </div>

          <label className="flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 bg-[#0B101B] px-2.5 text-[11px] text-slate-300">
            <input
              type="checkbox"
              checked={flushTod}
              onChange={(e) => setFlushTod(e.target.checked)}
              className="accent-sky-500"
            />
            <span>{t.rdmForceFlush}</span>
          </label>

          <button
            type="button"
            disabled={isScanning}
            onClick={() => void handleArtNetDiscover()}
            className="flex min-h-[38px] items-center gap-1.5 rounded-lg bg-sky-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950 transition-colors hover:bg-sky-400 disabled:opacity-50 whitespace-nowrap shrink-0"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? t.rdmScanning : t.rdmDiscoverBtn}</span>
          </button>

          <button
            type="button"
            disabled={isScanning}
            onClick={() => void handleWebSerialDiscover()}
            className="flex min-h-[38px] items-center gap-1.5 rounded-lg border border-white/15 bg-[#151D2E] px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-sky-500/50 hover:text-white disabled:opacity-50 whitespace-nowrap shrink-0"
          >
            <Usb className="h-3.5 w-3.5 text-amber-400" />
            <span>{t.rdmScanUsbBtn}</span>
          </button>
        </div>
      </div>

      {/* Telemetry & Protocol Summary Strip */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/8 bg-[#080B12] px-3.5 py-2 text-xs">
        <div className="font-mono-tabular text-[11px] text-slate-300">
          {lastTransport ? (
            <span>
              {lastTransport} · {t.rdmNodesLabel}{' '}
              <strong className="text-white">{nodesFound.length}</strong> · {t.rdmRespondersLabel}{' '}
              <strong className="text-sky-300">{discovered.length}</strong>
              {lastElapsedMs !== null ? ` · ${lastElapsedMs} ms` : ''}
            </span>
          ) : (
            <span className="text-slate-400">
              {t.rdmReadyHint}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowLog((v) => !v)}
          className="flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-white whitespace-nowrap shrink-0"
        >
          <Terminal className="h-3.5 w-3.5 text-sky-400" />
          <span>{showLog ? t.rdmHideLog : t.rdmViewLog(protocolLog.length)}</span>
        </button>
      </div>

      {scanError && (
        <p className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
          {scanError}
        </p>
      )}

      {notice && (
        <p className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
          {notice}
        </p>
      )}

      {/* Optional Protocol Packet Log */}
      {showLog && (
        <div className="mt-3 max-h-44 overflow-y-auto rounded-lg border border-white/8 bg-[#080B12] p-3 font-mono-tabular text-[11px]">
          {protocolLog.length === 0 ? (
            <div className="text-slate-500">
              {t.rdmLogEmpty}
            </div>
          ) : (
            <div className="space-y-1">
              {protocolLog.map((entry) => (
                <div key={entry.id} className="flex flex-wrap items-baseline gap-2">
                  <span className="text-slate-500">{entry.timestamp}</span>
                  <span
                    className={`font-semibold ${
                      entry.direction === 'TX'
                        ? 'text-amber-300'
                        : entry.direction === 'RX'
                          ? 'text-emerald-300'
                          : 'text-slate-400'
                    }`}
                  >
                    [{entry.direction} · {entry.protocol}]
                  </span>
                  <span className="text-slate-200">{entry.summary}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Discovered Nodes Summary (if any Art-Net nodes answered) */}
      {nodesFound.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
          {nodesFound.map((node) => (
            <div
              key={node.ip}
              className="rounded-lg border border-white/10 bg-[#0B101B] px-3 py-1.5 text-slate-300"
            >
              <span className="font-semibold text-white">{node.shortName}</span>{' '}
              <span className="font-mono-tabular text-sky-300">({node.ip})</span> ·{' '}
              <span>{node.rdmSupported ? t.rdmActive : t.rdmUnsupported}</span>
            </div>
          ))}
        </div>
      )}

      {/* Discovered Fixtures Table or Empty State */}
      <div className="mt-3">
        {discovered.length === 0 ? (
          <div className="rounded-lg border border-white/8 bg-[#0B101B] px-4 py-6 text-center">
            <p className="text-xs font-medium text-slate-300">
              {lastTransport ? t.rdmEmptyResponded : t.rdmEmptyIdle}
            </p>
            <p className="mx-auto mt-1 max-w-xl text-[11px] text-slate-500">
              {t.rdmEmptyHintBefore}{' '}
              <strong className="text-slate-300">{t.rdmDiscoverBtn}</strong>{' '}
              {t.rdmEmptyHintAfter}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={autoResolveConflicts}
                  onChange={(e) => setAutoResolveConflicts(e.target.checked)}
                  className="accent-sky-500"
                />
                <span>{t.rdmAutoResolve}</span>
              </label>

              <button
                type="button"
                onClick={handleImportAll}
                className="flex min-h-[36px] items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950 hover:bg-amber-400 whitespace-nowrap shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>
                  {unpatchedDevices.length > 0
                    ? t.rdmImportNew(unpatchedDevices.length)
                    : t.rdmImportAll(discovered.length)}
                </span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-white/8 bg-[#0B101B]">
              <table className="w-full min-w-[740px] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-[#12192A] text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                    <th className="px-3 py-2.5">{t.rdmColUid}</th>
                    <th className="px-3 py-2.5">{t.rdmColFixtureMfg}</th>
                    <th className="px-3 py-2.5">{t.rdmColCategory}</th>
                    <th className="px-3 py-2.5">{t.rdmColFootprint}</th>
                    <th className="px-3 py-2.5">{t.rdmColDmxAddr}</th>
                    <th className="px-3 py-2.5 text-right">{t.rdmColActions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/8">
                  {discovered.map((dev) => {
                    const alreadyPatched = patchedUids.has(dev.uid.toUpperCase());
                    const conflict = hasAddressConflict(dev);
                    return (
                      <tr key={dev.uid} className="hover:bg-white/[0.025]">
                        <td className="px-3 py-2.5 align-top">
                          <div className="font-mono-tabular font-semibold text-sky-300">
                            {dev.uid}
                          </div>
                          <div className="font-mono-tabular text-[11px] text-slate-500">
                            {dev.softwareVersion}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 align-top">
                          <div className="font-semibold text-white">
                            {dev.deviceLabel || dev.modelDescription}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {dev.manufacturerLabel}
                            {dev.sourceNodeIp ? ` · via ${dev.sourceNodeIp}` : ''}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 align-top text-slate-300">
                          <div>{dev.productCategoryName}</div>
                          <div className="font-mono-tabular text-[11px] text-slate-500">
                            Pers. {dev.currentPersonality}/{dev.personalityCount}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 align-top font-mono-tabular text-slate-200">
                          {dev.dmxFootprint}ch
                        </td>
                        <td className="px-3 py-2.5 align-top">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min={1}
                              max={512 - dev.dmxFootprint + 1}
                              value={dev.dmxStartAddress}
                              onChange={(e) =>
                                void handleRemoteSetAddress(
                                  dev,
                                  Number(e.target.value) || 1,
                                )
                              }
                              aria-label={`${t.rdmColDmxAddr} ${dev.uid}`}
                              className="font-mono-tabular h-8 w-16 rounded border border-white/15 bg-[#151D2E] px-2 text-xs text-sky-300 focus:border-sky-500 focus:outline-none"
                            />
                            {conflict && (
                              <span
                                title={t.rdmConflictTitle}
                                className="text-amber-400"
                              >
                                <AlertTriangle className="h-4 w-4" />
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-right align-top">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => void handleToggleIdentify(dev)}
                              className={`flex min-h-[34px] items-center gap-1 rounded-md border px-2.5 py-1 text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 ${
                                dev.identifying
                                  ? 'border-amber-400 bg-amber-500 text-slate-950'
                                  : 'border-white/10 bg-[#151D2E] text-slate-300 hover:border-amber-400/50 hover:text-amber-200'
                              }`}
                            >
                              <Lightbulb className="h-3.5 w-3.5" />
                              <span>{dev.identifying ? t.rdmIdentifying : t.rdmIdentify}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleImportSingle(dev)}
                              className={`flex min-h-[34px] items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 ${
                                alreadyPatched
                                  ? 'border border-emerald-500/40 bg-emerald-500/15 text-emerald-200'
                                  : 'bg-sky-500 text-slate-950 hover:bg-sky-400'
                              }`}
                            >
                              {alreadyPatched ? (
                                <>
                                  <Check className="h-3.5 w-3.5" />
                                  <span>{t.rdmPatched}</span>
                                </>
                              ) : (
                                <>
                                  <Plus className="h-3.5 w-3.5" />
                                  <span>{t.rdmPatch}</span>
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
