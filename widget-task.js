import React from 'react';
import { FlexWidget, TextWidget, requestWidgetUpdate } from 'react-native-android-widget';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { decode } from "./src/utils/security";
import { score } from "./src/utils/finance";

const formatMoney = (amount, cur = "$") => {
  return cur + Math.round(amount).toLocaleString('en-US');
};

export function FynxWidget({ balance = "$0", lang = "es" }) {
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
        paddingHorizontal: 22,
        paddingVertical: 20,
        flexDirection: 'column',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#D4AF3740',
      }}
    >
      <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
        <FlexWidget style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#4AFFE7', marginRight: 8 }} />
        <TextWidget text="TARS.SYS // ACTIVE" style={{ fontSize: 10, color: '#4AFFE7', letterSpacing: 2, fontWeight: 'bold' }} />
      </FlexWidget>
      
      <TextWidget text={L.balanceLabel} style={{ fontSize: 10, color: '#D4AF3780', letterSpacing: 1.5, marginBottom: 4, fontWeight: 'bold' }} />
      <TextWidget text={balance} style={{ fontSize: 32, color: '#FFFFFF', fontWeight: 'bold', marginBottom: 16 }} />
      
      <FlexWidget style={{ height: 1, width: 'match_parent', backgroundColor: '#D4AF3730', marginBottom: 16 }} />
      
      <TextWidget text={L.prompt} style={{ fontSize: 12, color: '#A0A0A0', fontWeight: 'bold', letterSpacing: 0.5 }} />
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
