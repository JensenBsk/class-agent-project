"use client";

// React hook that loads the tracker from localStorage after the page mounts,
// and saves it after every change. Pages read from `tracker` / `log` and make
// changes through `update` / `updateAsync`, which re-render the page.

import { useCallback, useEffect, useState } from "react";
import {
  clearSavedTracker,
  CorruptTrackerDataError,
  loadTracker,
  saveTracker,
  type LoadedTracker,
} from "./storage";
import { AgentActivityLog } from "./approvals";
import { ApplicationTracker } from "./tracker";

export type TrackerLoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: LoadedTracker; savedOk: boolean };

export function useTracker() {
  const [state, setState] = useState<TrackerLoadState>({ status: "loading" });

  useEffect(() => {
    try {
      setState({ status: "ready", data: loadTracker(), savedOk: true });
    } catch (err) {
      setState({
        status: "error",
        message: err instanceof CorruptTrackerDataError ? err.message : "Your tracker couldn't be loaded.",
      });
    }
  }, []);

  const commit = useCallback((data: LoadedTracker) => {
    const savedOk = saveTracker(data);
    // New wrapper object so React re-renders; the classes inside are reused.
    setState({ status: "ready", data: { ...data }, savedOk });
  }, []);

  /** Run a change, save, and re-render. Errors are rethrown for the caller to show. */
  const update = useCallback(
    <T,>(change: (data: LoadedTracker) => T): T => {
      if (state.status !== "ready") throw new Error("The tracker hasn't loaded yet.");
      try {
        return change(state.data);
      } finally {
        commit(state.data);
      }
    },
    [state, commit],
  );

  const updateAsync = useCallback(
    async <T,>(change: (data: LoadedTracker) => Promise<T>): Promise<T> => {
      if (state.status !== "ready") throw new Error("The tracker hasn't loaded yet.");
      try {
        return await change(state.data);
      } finally {
        commit(state.data);
      }
    },
    [state, commit],
  );

  /** Delete all saved tracker data on this device and start empty. */
  const startFresh = useCallback(() => {
    clearSavedTracker();
    commit({ tracker: new ApplicationTracker(), log: new AgentActivityLog() });
  }, [commit]);

  return { state, update, updateAsync, startFresh };
}
