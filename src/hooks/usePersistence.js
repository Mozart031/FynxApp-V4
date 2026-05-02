import { useState, useEffect, useRef } from "react";
import { loadApp, saveApp, loadFreno, activateFreno, deactivateFreno } from "../utils/security";
import { sincronizarDatos } from "../services/firebase";

export function usePersistence() {
  const [appState,   setAppState]   = useState(null);
  const [frenoState, setFrenoState] = useState({ active: false, hoursLeft: 0 });
  const saveTimer = useRef(null);

  useEffect(() => {
    Promise.all([loadApp(), loadFreno()]).then(([saved, freno]) => {
      setFrenoState(freno);
      if (saved && (saved.onboarded || saved.setupCompleted) && saved.user) {
        setAppState({ ...saved, onboarded: true });
      } else {
        setAppState({ onboarded: false });
      }
    }).catch(() => setAppState({ onboarded: false }));
  }, []);

  function updateState(changes) {
    setAppState(prev => {
      const next = { ...prev, ...changes };
      saveApp(next); // Guardar en local de inmediato, sin esperar
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        if (next.user?.uid) sincronizarDatos(next.user.uid, next);
      }, 800);
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
