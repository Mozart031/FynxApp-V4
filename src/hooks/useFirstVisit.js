/**
 * useFirstVisit — Persiste si el usuario ya vio el hint de cada pantalla.
 * Uso: const { isFirstVisit, markVisited } = useFirstVisit("chat");
 */
import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@fynx_first_visits";

export function useFirstVisit(screenKey) {
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const visited = raw ? JSON.parse(raw) : {};
        setIsFirstVisit(!visited[screenKey]);
      } catch {
        setIsFirstVisit(true);
      } finally {
        setLoaded(true);
      }
    })();
  }, [screenKey]);

  const markVisited = useCallback(async () => {
    setIsFirstVisit(false);
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const visited = raw ? JSON.parse(raw) : {};
      visited[screenKey] = true;
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(visited));
    } catch {}
  }, [screenKey]);

  return { isFirstVisit: loaded && isFirstVisit, markVisited };
}
