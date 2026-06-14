"use no memo";
// ^^^ CRITICAL for React 19 + react-native-android-widget:
// The React Compiler (React 19) transforms components, breaking the library's
// internal widget tree builder which calls component functions directly.
// This directive disables the compiler for this entire file.

import React from 'react';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { decode } from "./src/utils/security";
import { score } from "./src/utils/finance";

let RNWidget = null;
try {
  RNWidget = require('react-native-android-widget');
} catch (e) {
  // Silently fail — module not available (e.g. Expo Go or iOS)
}

const formatMoney = (amount, cur = "$") => {
  return cur + Math.round(amount).toLocaleString('en-US');
};

// NOTE: All colors MUST be hex strings. Android RemoteViews does NOT support
// rgba() CSS notation. Alpha-capable colors use 8-digit hex: #AARRGGBB.
// rgba(255,255,255,0.95) → #F2FFFFFF  |  rgba(0,0,0,0.1) → #1A000000
export function FynxWidget({ balance = "$0", scoreTotal = 0, lang = "es", theme = "dark", widgetInfo }) {
  if (!RNWidget) return null;
  const { FlexWidget, TextWidget } = RNWidget;

  const isSmall     = widgetInfo && widgetInfo.width < 150;
  const isVerySmall = widgetInfo && widgetInfo.width < 100;

  const isDark        = theme === "dark";
  const isTransparent = theme === "transparent";

  // All colors in hex (8-digit ARGB when alpha needed)
  const bg        = isTransparent ? "transparent"  : (isDark ? "#050505"    : "#F2FFFFFF");
  const text1     = isDark || isTransparent         ? "#FFFFFF"              : "#1A1A1A";
  const text2     = isDark || isTransparent         ? "#A0A0A0"              : "#666666";
  const borderCol = isTransparent ? "transparent"  : (isDark ? "#40D4AF37"  : "#1A000000");
  const lineCol   = isDark || isTransparent         ? "#30D4AF37"            : "#0D000000";
  const accentCol = isDark || isTransparent         ? "#80D4AF37"            : "#D4AF37";

  const L = {
    balanceLabel: lang === "en" ? "AVAILABLE BALANCE" : "BALANCE DISPONIBLE",
    prompt:       lang === "en" ? "> Ready to log today's expenses?" : "> Que vamos a registrar hoy?",
  };

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: bg,
        borderRadius: 24,
        paddingHorizontal: isSmall ? 12 : 22,
        paddingVertical: isSmall ? 12 : 20,
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      {/* Top Row: System Status & Score */}
      <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: isSmall ? 8 : 14 }}>
        <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
          <FlexWidget style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#4AFFE7', marginRight: 6 }} />
          <TextWidget
            text={isSmall ? "TARS" : "TARS.SYS // ACTIVE"}
            style={{ fontSize: 9, color: '#4AFFE7', fontWeight: 'bold' }}
          />
        </FlexWidget>

        {!isVerySmall && (
          <FlexWidget style={{ backgroundColor: '#20D4AF37', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
            <TextWidget
              text={`SC: ${scoreTotal}`}
              style={{ fontSize: 9, color: '#D4AF37', fontWeight: 'bold' }}
            />
          </FlexWidget>
        )}
      </FlexWidget>

      {!isVerySmall && (
        <TextWidget
          text={L.balanceLabel}
          style={{ fontSize: isSmall ? 8 : 10, color: accentCol, marginBottom: 2, fontWeight: 'bold' }}
        />
      )}
      <TextWidget
        text={balance}
        style={{ fontSize: isSmall ? 24 : 32, color: text1, fontWeight: 'bold', marginBottom: isSmall ? 8 : 16 }}
      />

      {!isSmall && (
        <>
          <FlexWidget style={{ height: 1, width: 'match_parent', backgroundColor: lineCol, marginBottom: 16 }} />
          <TextWidget
            text={L.prompt}
            style={{ fontSize: 11, color: text2, fontWeight: 'bold' }}
          />
        </>
      )}
    </FlexWidget>
  );
}

export async function widgetTask({ widgetAction, widgetInfo, renderWidget: systemRenderWidget } = {}) {
  // The task handler is called by registerWidgetTaskHandler with a renderWidget function
  // that draws directly to the widget. We should use THAT when available (background mode).
  // requestWidgetUpdate is for when called manually from inside the running app.

  const ALLOWED = ['WIDGET_ADDED', 'WIDGET_UPDATE', 'WIDGET_RESIZED'];
  if (widgetAction && !ALLOWED.includes(widgetAction)) {
    return;
  }

  const STORE_KEY = "mifinanzas_v7";
  let balance    = "$0";
  let scoreTotal = 1000;
  let incRaw     = 0;
  let expRaw     = 0;

  try {
    const raw = await AsyncStorage.getItem(STORE_KEY);
    if (raw) {
      let state = null;
      try {
        state = JSON.parse(decode(raw));
      } catch {
        try { state = JSON.parse(raw); } catch { state = null; }
      }

      if (state) {
        const cur = state.user?.currency || "$";
        incRaw = (state.income   || []).reduce((a, b) => a + (b.amount || 0), 0);
        expRaw = (state.expenses || []).reduce((a, b) => a + (b.amount || 0), 0);
        balance = formatMoney(incRaw - expRaw, cur);

        const sc = score(state.expenses || [], incRaw, state.budgets || {}, state.streakDays || [], []);
        scoreTotal = sc.total;
      }
    }
  } catch (e) {
    console.warn("[FynxWidget] Error reading AsyncStorage:", e);
  }

  let lang  = "es";
  let theme = "dark";
  try {
    const storedLang  = await AsyncStorage.getItem("@fynx_lang");
    const storedTheme = await AsyncStorage.getItem("@fynx_widget_theme");
    if (storedLang  === "en" || storedLang  === "es") lang  = storedLang;
    if (storedTheme) theme = storedTheme;
  } catch { /* fallback */ }

  const widgetElement = (info) => (
    <FynxWidget
      balance={balance}
      scoreTotal={scoreTotal}
      lang={lang}
      theme={theme}
      widgetInfo={info || widgetInfo}
    />
  );

  try {
    if (RNWidget) {
      if (systemRenderWidget) {
        // Called from background task via registerWidgetTaskHandler — use the system's renderWidget
        // which draws directly to the specific widget instance by ID.
        systemRenderWidget(widgetElement(widgetInfo));
      } else {
        // Called manually from the running app — use requestWidgetUpdate which iterates all instances.
        await RNWidget.requestWidgetUpdate({
          widgetName: 'FynxWidget',
          renderWidget: widgetElement,
          widgetNotFound: () => console.warn("[FynxWidget] No widget instances found on home screen"),
        });
      }
    }
  } catch (e) {
    console.warn("[FynxWidget] Error updating widget:", e);
  }
}

// Called manually from the app to refresh the widget
export async function updateFynxWidgetLocal() {
  await widgetTask({});
}
