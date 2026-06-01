/**
 * TARS — Componente de texto Typewriter
 * Velocidad: 25 ms por carácter (especificación PRD).
 * Incluye botón "Omitir" para saltar la animación.
 */
import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { C } from "../constants/themes";

export function TypewriterText({
  text,
  speed     = 25,
  style,
  onComplete,
  showSkip  = true,
  skipLabel  = "Omitir",
}) {
  const [displayed, setDisplayed] = useState("");
  const [done,      setDone]      = useState(false);
  const timerRef = useRef(null);
  const indexRef = useRef(0);
  const prevTextRef = useRef(text);

  if (text !== prevTextRef.current) {
    prevTextRef.current = text;
    setDisplayed("");
    setDone(false);
    indexRef.current = 0;
  }

  useEffect(() => {

    if (!text) return;

    timerRef.current = setInterval(() => {
      if (indexRef.current < text.length) {
        const next = text.slice(0, indexRef.current + 1);
        setDisplayed(next);
        indexRef.current++;
      } else {
        clearInterval(timerRef.current);
        setDone(true);
        onComplete?.();
      }
    }, speed);

    return () => clearInterval(timerRef.current);
  }, [text]);

  function omitir() {
    clearInterval(timerRef.current);
    setDisplayed(text);
    setDone(true);
    onComplete?.();
  }

  return (
    <View>
      <Text style={[{ fontSize: 13, color: C.t2, lineHeight: 22 }, style]}>
        {displayed}
        {/* Cursor parpadeante mientras escribe */}
        {!done && (
          <Text style={{ color: C.mint, fontWeight: "900" }}>|</Text>
        )}
      </Text>
      {!done && showSkip && (
        <TouchableOpacity
          onPress={omitir}
          style={{ marginTop: 10, alignSelf: "flex-end" }}
        >
          <Text style={{ fontSize: 11, color: C.t3, fontWeight: "600" }}>
            {skipLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
