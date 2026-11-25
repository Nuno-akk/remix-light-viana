import {useCallback, useRef, useState} from 'react';
import {useLanguage} from '../i18n/LanguageContext';
import {
  BeamFxState,
  ColorFxState,
  FlashFxState,
  GroupDimmerState,
  MoveFxState,
  SceneBank,
} from '../types/dmx';

const MAX_UNDO_STEPS = 40;
const COALESCE_WINDOW_MS = 650;

export interface BankConsoleSnapshot {
  banks: SceneBank[];
  activeBankId: string | null;
  activeSceneId: string | null;
  moveFx: MoveFxState;
  colorFx: ColorFxState;
  beamFx: BeamFxState;
  flashFx: FlashFxState;
  bpm: number;
  masterDimmer: number;
  groupDimmers: GroupDimmerState;
  fixtureDimmers: Record<string, number>;
  fixtureMutes: Record<string, boolean>;
  fixtureColors: Record<string, string>;
  rawDmxOverrides: Record<number, number>;
}

export interface UndoHistoryEntry {
  id: string;
  label: string;
  timestamp: number;
  snapshot: BankConsoleSnapshot;
}

export function cloneBankConsoleSnapshot(
  snap: BankConsoleSnapshot,
): BankConsoleSnapshot {
  return {
    banks: structuredClone(snap.banks),
    activeBankId: snap.activeBankId,
    activeSceneId: snap.activeSceneId,
    moveFx: {...snap.moveFx},
    colorFx: {
      ...snap.colorFx,
      colors: [...snap.colorFx.colors] as [string, string, string],
    },
    beamFx: {...snap.beamFx},
    flashFx: {...snap.flashFx},
    bpm: snap.bpm,
    masterDimmer: snap.masterDimmer,
    groupDimmers: {...snap.groupDimmers},
    fixtureDimmers: {...snap.fixtureDimmers},
    fixtureMutes: {...snap.fixtureMutes},
    fixtureColors: {...snap.fixtureColors},
    rawDmxOverrides: {...snap.rawDmxOverrides},
  };
}

interface UseBankUndoRedoOptions {
  getCurrentSnapshot: () => BankConsoleSnapshot;
  applySnapshot: (snapshot: BankConsoleSnapshot) => void;
}

export function useBankUndoRedo({
  getCurrentSnapshot,
  applySnapshot,
}: UseBankUndoRedoOptions) {
  const {t} = useLanguage();
  const [undoStack, setUndoStack] = useState<UndoHistoryEntry[]>([]);
  const [redoStack, setRedoStack] = useState<UndoHistoryEntry[]>([]);
  const [feedbackEvent, setFeedbackEvent] = useState<{
    kind: 'undone' | 'redone' | 'restored';
    label: string;
  } | null>(null);

  const undoStackRef = useRef<UndoHistoryEntry[]>(undoStack);
  const redoStackRef = useRef<UndoHistoryEntry[]>(redoStack);
  const lastCoalesceRef = useRef<{key: string; timestamp: number} | null>(null);
  const getCurrentSnapshotRef = useRef(getCurrentSnapshot);
  const applySnapshotRef = useRef(applySnapshot);

  undoStackRef.current = undoStack;
  redoStackRef.current = redoStack;
  getCurrentSnapshotRef.current = getCurrentSnapshot;
  applySnapshotRef.current = applySnapshot;

  /**
   * Call BEFORE applying a state mutation to preserve the previous state.
   * Passing a coalesceKey groups rapid continuous slider drags (within 650ms)
   * into a single clean undo step.
   */
  const recordCheckpoint = useCallback(
    (label: string, coalesceKey?: string) => {
      const now = Date.now();
      if (
        coalesceKey &&
        lastCoalesceRef.current &&
        lastCoalesceRef.current.key === coalesceKey &&
        now - lastCoalesceRef.current.timestamp <= COALESCE_WINDOW_MS
      ) {
        lastCoalesceRef.current.timestamp = now;
        return;
      }

      lastCoalesceRef.current = coalesceKey
        ? {key: coalesceKey, timestamp: now}
        : null;

      const entry: UndoHistoryEntry = {
        id: `hist-${now}-${Math.random().toString(36).slice(2, 7)}`,
        label,
        timestamp: now,
        snapshot: cloneBankConsoleSnapshot(getCurrentSnapshotRef.current()),
      };

      const nextUndo = [...undoStackRef.current, entry].slice(-MAX_UNDO_STEPS);
      undoStackRef.current = nextUndo;
      redoStackRef.current = [];
      setUndoStack(nextUndo);
      setRedoStack([]);
      setFeedbackEvent(null);
    },
    [],
  );

  const undo = useCallback(() => {
    const stack = undoStackRef.current;
    if (stack.length === 0) return false;

    lastCoalesceRef.current = null;
    const targetEntry = stack[stack.length - 1];
    const nextUndo = stack.slice(0, -1);

    const redoEntry: UndoHistoryEntry = {
      id: `redo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      label: targetEntry.label,
      timestamp: Date.now(),
      snapshot: cloneBankConsoleSnapshot(getCurrentSnapshotRef.current()),
    };
    const nextRedo = [...redoStackRef.current, redoEntry].slice(-MAX_UNDO_STEPS);

    undoStackRef.current = nextUndo;
    redoStackRef.current = nextRedo;
    setUndoStack(nextUndo);
    setRedoStack(nextRedo);
    setFeedbackEvent({kind: 'undone', label: targetEntry.label});

    applySnapshotRef.current(cloneBankConsoleSnapshot(targetEntry.snapshot));
    return true;
  }, []);

  const redo = useCallback(() => {
    const stack = redoStackRef.current;
    if (stack.length === 0) return false;

    lastCoalesceRef.current = null;
    const targetEntry = stack[stack.length - 1];
    const nextRedo = stack.slice(0, -1);

    const undoEntry: UndoHistoryEntry = {
      id: `undo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      label: targetEntry.label,
      timestamp: Date.now(),
      snapshot: cloneBankConsoleSnapshot(getCurrentSnapshotRef.current()),
    };
    const nextUndo = [...undoStackRef.current, undoEntry].slice(-MAX_UNDO_STEPS);

    undoStackRef.current = nextUndo;
    redoStackRef.current = nextRedo;
    setUndoStack(nextUndo);
    setRedoStack(nextRedo);
    setFeedbackEvent({kind: 'redone', label: targetEntry.label});

    applySnapshotRef.current(cloneBankConsoleSnapshot(targetEntry.snapshot));
    return true;
  }, []);

  /**
   * Jump directly back to a specific index in undoStack (0 = oldest, length-1 = most recent).
   */
  const restoreUndoIndex = useCallback((targetIndex: number) => {
    const stack = undoStackRef.current;
    if (targetIndex < 0 || targetIndex >= stack.length) return;

    lastCoalesceRef.current = null;
    const stepsBack = stack.length - targetIndex;
    let workingUndo = [...stack];
    let workingRedo = [...redoStackRef.current];
    let liveSnap = cloneBankConsoleSnapshot(getCurrentSnapshotRef.current());
    let restoredLabel = stack[targetIndex].label;

    for (let i = 0; i < stepsBack; i += 1) {
      const entry = workingUndo.pop();
      if (!entry) break;
      workingRedo.push({
        id: `redo-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
        label: entry.label,
        timestamp: Date.now(),
        snapshot: liveSnap,
      });
      liveSnap = cloneBankConsoleSnapshot(entry.snapshot);
      restoredLabel = entry.label;
    }

    workingRedo = workingRedo.slice(-MAX_UNDO_STEPS);
    undoStackRef.current = workingUndo;
    redoStackRef.current = workingRedo;
    setUndoStack(workingUndo);
    setRedoStack(workingRedo);
    setFeedbackEvent({kind: 'restored', label: restoredLabel});

    applySnapshotRef.current(liveSnap);
  }, []);

  const clearHistory = useCallback(() => {
    lastCoalesceRef.current = null;
    undoStackRef.current = [];
    redoStackRef.current = [];
    setUndoStack([]);
    setRedoStack([]);
    setFeedbackEvent(null);
  }, []);

  const lastFeedback = feedbackEvent
    ? feedbackEvent.kind === 'undone'
      ? t.undoFeedbackUndone(feedbackEvent.label)
      : feedbackEvent.kind === 'redone'
        ? t.undoFeedbackRedone(feedbackEvent.label)
        : t.undoFeedbackRestored(feedbackEvent.label)
    : null;

  return {
    undoStack,
    redoStack,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    nextUndoLabel: undoStack[undoStack.length - 1]?.label ?? null,
    nextRedoLabel: redoStack[redoStack.length - 1]?.label ?? null,
    lastFeedback,
    recordCheckpoint,
    undo,
    redo,
    restoreUndoIndex,
    clearHistory,
  };
}
