import { useState, useEffect, useRef } from "react";
import { loadApp, saveApp, loadFreno, activateFreno, deactivateFreno } from "../utils/security";

export function usePersistence() {
  const [appState,   setAppState]   = useState(null);
  const [frenoState, setFrenoState] = useState({ active: false, hoursLeft: 0 });
  const saveTimer = useRef(null);

  useEffect(() => {
    Promise.all([loadApp(), loadFreno()]).then(([saved, freno]) => {
      setFrenoState(freno);
      if (saved && saved.onboarded && saved.user) {
        setAppState(saved);
      } else {
        setAppState({ onboarded: false });
      }
    }).catch(() => setAppState({ onboarded: false }));
  }, []);

  function updateState(changes) {
    setAppState(prev => {
      const next = { ...prev, ...changes };
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => saveApp(next), 800);
      return next;
    });
  }

  async function toggleFreno() {
    if (frenoState.active) {
      await deactivateFreno();
      setFrenoState({ active: false, hoursLeft: 0 });
    } else {
      await activateFreno();
      setFrenoState({ active: true, hoursLeft: 48, activatedAt: Date.now() });
    }
  }

  return { appState, setAppState, updateState, frenoState, toggleFreno };
}
