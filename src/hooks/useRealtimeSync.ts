import {useCallback, useEffect, useRef, useState} from 'react';
import {
  BeamFxState,
  ColorFxState,
  Fixture,
  FlashFxState,
  GroupDimmerState,
  MoveFxState,
  SceneBank,
  ShowPreset,
} from '../types/dmx';

export interface SyncedShowState {
  moveFx: MoveFxState;
  colorFx: ColorFxState;
  flashFx: FlashFxState;
  beamFx: BeamFxState;
  bpm: number;
  masterDimmer: number;
  groupDimmers?: GroupDimmerState;
  fixtureDimmers?: Record<string, number>;
  fixtureMutes?: Record<string, boolean>;
  fixtureColors?: Record<string, string>;
  rawDmxOverrides?: Record<number, number>;
  fixtures: Fixture[];
  presets: ShowPreset[];
  activePresetId: string | null;
  banks?: SceneBank[];
  activeBankId?: string | null;
  activeSceneId?: string | null;
}

export interface ConnectedDevice {
  id: string;
  name: string;
  role: 'windows' | 'android' | 'web';
  connectedAt: number;
}

export type SyncStatus = 'connecting' | 'connected' | 'reconnecting' | 'standalone';

export function detectDeviceRole(): {
  role: 'windows' | 'android' | 'web';
  defaultName: string;
} {
  const ua = navigator.userAgent.toLowerCase();
  const params = new URLSearchParams(window.location.search);
  if (params.get('mode') === 'tablet' || ua.includes('android')) {
    return {role: 'android', defaultName: 'Android Tablet'};
  }
  if (ua.includes('windows')) {
    return {role: 'windows', defaultName: 'Windows PC'};
  }
  return {role: 'web', defaultName: 'Web Console'};
}

interface UseRealtimeSyncOptions {
  roomId: string;
  deviceName: string;
  deviceRole: 'windows' | 'android' | 'web';
  onRemoteInit: (state: SyncedShowState) => void;
  onRemotePatch: (patch: Partial<SyncedShowState>) => void;
}

export function useRealtimeSync({
  roomId,
  deviceName,
  deviceRole,
  onRemoteInit,
  onRemotePatch,
}: UseRealtimeSyncOptions) {
  const [status, setStatus] = useState<SyncStatus>(() =>
    typeof window !== 'undefined' &&
    (window.location.protocol === 'file:' || !navigator.onLine)
      ? 'standalone'
      : 'connecting',
  );
  const [devices, setDevices] = useState<ConnectedDevice[]>([]);
  const [selfId, setSelfId] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const pendingPatchesRef = useRef<Partial<SyncedShowState>[]>([]);
  const reconnectTimerRef = useRef<number | null>(null);
  const retryAttemptRef = useRef<number>(0);
  const hasConnectedOnceRef = useRef<boolean>(false);
  const onInitRef = useRef(onRemoteInit);
  const onPatchRef = useRef(onRemotePatch);

  onInitRef.current = onRemoteInit;
  onPatchRef.current = onRemotePatch;

  useEffect(() => {
    if (window.location.protocol === 'file:') {
      setStatus('standalone');
      return;
    }

    let disposed = false;

    const clearReconnectTimer = () => {
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    const connect = () => {
      if (disposed) return;
      clearReconnectTimer();

      if (!navigator.onLine) {
        setStatus('standalone');
        return;
      }

      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${proto}//${window.location.host}/ws?room=${encodeURIComponent(
        roomId,
      )}&role=${encodeURIComponent(deviceRole)}&name=${encodeURIComponent(deviceName)}`;

      setStatus(hasConnectedOnceRef.current ? 'reconnecting' : 'connecting');

      let ws: WebSocket;
      try {
        ws = new WebSocket(wsUrl);
      } catch {
        setStatus('standalone');
        return;
      }
      wsRef.current = ws;

      ws.onopen = () => {
        if (disposed) return;
        hasConnectedOnceRef.current = true;
        retryAttemptRef.current = 0;
        setStatus('connected');
        while (pendingPatchesRef.current.length > 0) {
          const patch = pendingPatchesRef.current.shift();
          if (patch) {
            ws.send(JSON.stringify({type: 'state:patch', patch}));
          }
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(String(event.data)) as {
            type: string;
            selfId?: string;
            state?: SyncedShowState;
            patch?: Partial<SyncedShowState>;
            devices?: ConnectedDevice[];
          };

          if (msg.type === 'state:init' && msg.state) {
            if (msg.selfId) setSelfId(msg.selfId);
            if (Array.isArray(msg.devices)) setDevices(msg.devices);
            onInitRef.current(msg.state);
          } else if (msg.type === 'state:patch' && msg.patch) {
            onPatchRef.current(msg.patch);
          } else if (msg.type === 'presence:update' && Array.isArray(msg.devices)) {
            setDevices(msg.devices);
          }
        } catch {
          // Ignore malformed frame
        }
      };

      ws.onclose = () => {
        if (disposed) return;
        wsRef.current = null;
        if (!navigator.onLine) {
          setStatus('standalone');
          return;
        }
        retryAttemptRef.current += 1;
        // Exponential backoff up to 30s; switch to standalone if host is unreachable
        if (!hasConnectedOnceRef.current && retryAttemptRef.current >= 2) {
          setStatus('standalone');
        } else {
          setStatus('reconnecting');
        }
        const delayMs = Math.min(
          30000,
          1500 * Math.pow(2, Math.min(retryAttemptRef.current - 1, 4)),
        );
        reconnectTimerRef.current = window.setTimeout(connect, delayMs);
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    const handleOnline = () => {
      if (disposed) return;
      retryAttemptRef.current = 0;
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        connect();
      }
    };

    const handleOffline = () => {
      if (disposed) return;
      clearReconnectTimer();
      wsRef.current?.close();
      wsRef.current = null;
      setStatus('standalone');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    connect();

    return () => {
      disposed = true;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearReconnectTimer();
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [roomId, deviceRole, deviceName]);

  const sendPatch = useCallback((patch: Partial<SyncedShowState>) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({type: 'state:patch', patch}));
    } else {
      pendingPatchesRef.current.push(patch);
      if (pendingPatchesRef.current.length > 20) {
        pendingPatchesRef.current.shift();
      }
    }
  }, []);

  return {
    status,
    devices,
    selfId,
    sendPatch,
  };
}
