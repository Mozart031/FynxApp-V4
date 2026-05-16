import React from 'react';
import { FlexWidget, TextWidget, requestWidgetUpdate } from 'react-native-android-widget';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { decode } from "./src/utils/security";
import { score } from "./src/utils/finance";

const formatMoney = (amount, cur = "$") => {
  return cur + Math.round(amount).toLocaleString('en-US');
};

export function FynxWidget({ balance = "$0", scoreTotal = 0, lang = "es", widgetInfo }) {
  const isSmall = widgetInfo && widgetInfo.width < 150;
  const isVerySmall = widgetInfo && widgetInfo.width < 100;

  const L = {
    balanceLabel: lang === "en" ? "AVAILABLE BALANCE" : "BALANCE DISPONIBLE",
    prompt:       lang === "en" ? "> Ready to log today's expenses?" : "> ¿Qué vamos a registrar hoy?",
  };

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#050505',
        borderRadius: 24,
        paddingHorizontal: isSmall ? 12 : 22,
        paddingVertical: isSmall ? 12 : 20,
        flexDirection: 'column',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#D4AF3740',
      }}
    >
      {/* Top Row: System Status & Score */}
      <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: isSmall ? 8 : 14 }}>
        <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
          <FlexWidget style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#4AFFE7', marginRight: 6 }} />
          <TextWidget text={isSmall ? "TARS" : "TARS.SYS // ACTIVE"} style={{ fontSize: 9, color: '#4AFFE7', letterSpacing: 1.5, fontWeight: 'bold' }} />
        </FlexWidget>
        
        {!isVerySmall && (
          <FlexWidget style={{ backgroundColor: '#D4AF3720', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 0.5, borderColor: '#D4AF3740' }}>
            <TextWidget text={`SC: ${scoreTotal}`} style={{ fontSize: 9, color: '#D4AF37', fontWeight: 'bold', fontFamily: 'monospace' }} />
          </FlexWidget>
        )}
      </FlexWidget>
      
      {!isVerySmall && <TextWidget text={L.balanceLabel} style={{ fontSize: isSmall ? 8 : 10, color: '#D4AF3780', letterSpacing: 1.5, marginBottom: 2, fontWeight: 'bold' }} />}
      <TextWidget text={balance} style={{ fontSize: isSmall ? 24 : 32, color: '#FFFFFF', fontWeight: 'bold', marginBottom: isSmall ? 8 : 16 }} />
      
      {!isSmall && (
        <>
          <FlexWidget style={{ height: 1, width: 'match_parent', backgroundColor: '#D4AF3730', marginBottom: 16 }} />
          <TextWidget text={L.prompt} style={{ fontSize: 11, color: '#A0A0A0', fontWeight: 'bold', letterSpacing: 0.5 }} />
        </>
      )}
    </FlexWidget>
  );
}

export async function widgetTask({ widgetAction, widgetInfo } = {}) {
  if (widgetAction && !['WIDGET_ADDED', 'WIDGET_UPDATE', 'WIDGET_RESIZED'].includes(widgetAction)) {
    return;
  }

  const STORE_KEY = "mifinanzas_v7";
  let balance = "$0";
  let income  = "$0";
  let expense = "$0";
  let scoreTotal = 1000;
  let incRaw = 0;
  let expRaw = 0;

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
        income  = formatMoney(incRaw, cur);
        expense = formatMoney(expRaw, cur);

        const sc = score(state.expenses || [], incRaw, state.budgets || {}, state.streakDays || [], []);
        scoreTotal = sc.total;
      }
    }
  } catch (e) {
    console.warn("[FynxWidget] Error reading AsyncStorage:", e);
  }

  // Read user's chosen language
  let lang = "es";
  try {
    const storedLang = await AsyncStorage.getItem("@fynx_lang");
    if (storedLang === "en" || storedLang === "es") lang = storedLang;
  } catch { /* fallback to es */ }

  try {
    requestWidgetUpdate({
      widgetName: 'FynxWidget',
      renderWidget: () => <FynxWidget balance={balance} income={income} expense={expense} scoreTotal={scoreTotal} incRaw={incRaw} expRaw={expRaw} lang={lang} />,
      widgetInfo,
    });
  } catch(e) {
    console.warn("[FynxWidget] Error updating widget:", e);
  }
}

// Exportar función manual para actualizar desde la app
export async function updateFynxWidgetLocal() {
  await widgetTask({ widgetAction: 'WIDGET_UPDATE' });
}
