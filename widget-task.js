import React from 'react';
import { FlexWidget, TextWidget, requestWidgetUpdate } from 'react-native-android-widget';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { decode } from "./src/utils/security";
import { score } from "./src/utils/finance";

const formatMoney = (amount, cur = "$") => {
  return cur + Math.round(amount).toLocaleString('en-US');
};

export function FynxWidget({ balance = "$0", income = "$0", expense = "$0", scoreTotal = 1000, incRaw = 0, expRaw = 0, lang = "es" }) {
  const totalFlow = incRaw + expRaw;
  const incPercent = totalFlow > 0 ? Math.min(Math.max((incRaw / totalFlow) * 100, 5), 95) : 50;

  const L = {
    balanceLabel: lang === "en" ? "TOTAL BALANCE" : "BALANCE TOTAL",
    income:       lang === "en" ? "INCOME"        : "INGRESOS",
    expense:      lang === "en" ? "EXPENSES"      : "GASTOS",
  };

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#0A0A0A',
        borderRadius: 24,
        paddingHorizontal: 22,
        paddingVertical: 18,
        flexDirection: 'column',
        justifyContent: 'space_between',
        borderWidth: 2,
        borderColor: '#D4AF3780',
      }}
    >
      {/* Header */}
      <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space_between', alignItems: 'center' }}>
        <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
           <FlexWidget style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#D4AF37', marginRight: 8 }} />
           <TextWidget text="FYNX ELITE" style={{ fontSize: 13, color: '#D4AF37', fontWeight: 'bold', letterSpacing: 2 }} />
        </FlexWidget>
        <TextWidget text={String(scoreTotal)} style={{ fontSize: 16, color: '#4AFFE7', fontWeight: 'bold' }} />
      </FlexWidget>

      {/* Balance */}
      <FlexWidget style={{ flexDirection: 'column', alignItems: 'center', marginVertical: 8 }}>
        <TextWidget text={L.balanceLabel} style={{ fontSize: 11, color: '#A0A0A0', letterSpacing: 1.5, marginBottom: 4 }} />
        <TextWidget text={balance} style={{ fontSize: 36, color: '#FFFFFF', fontWeight: 'bold' }} />
      </FlexWidget>

      {/* Progress Bar */}
      <FlexWidget style={{ height: 3, width: 'match_parent', backgroundColor: '#D4AF3730', borderRadius: 2, marginVertical: 8 }}>
        <FlexWidget style={{ height: 'match_parent', width: `${incPercent}%`, backgroundColor: '#D4AF37', borderRadius: 2 }} />
      </FlexWidget>

      {/* Footer */}
      <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space_between', paddingHorizontal: 4 }}>
        
        {/* Income */}
        <FlexWidget style={{ flexDirection: 'column', alignItems: 'flex_start' }}>
          <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
            <TextWidget text="↑ " style={{ fontSize: 15, color: '#D4AF37', fontWeight: 'bold' }} />
            <TextWidget text={income} style={{ fontSize: 15, color: '#FFFFFF', fontWeight: 'bold' }} />
          </FlexWidget>
          <TextWidget text={L.income} style={{ fontSize: 10, color: '#8A8A8A', fontWeight: 'bold', letterSpacing: 1, marginLeft: 16 }} />
        </FlexWidget>

        {/* Expenses */}
        <FlexWidget style={{ flexDirection: 'column', alignItems: 'flex_end' }}>
          <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
            <TextWidget text="↓ " style={{ fontSize: 15, color: '#D4AF37', fontWeight: 'bold' }} />
            <TextWidget text={expense} style={{ fontSize: 15, color: '#FFFFFF', fontWeight: 'bold' }} />
          </FlexWidget>
          <TextWidget text={L.expense} style={{ fontSize: 10, color: '#8A8A8A', fontWeight: 'bold', letterSpacing: 1, marginRight: 16 }} />
        </FlexWidget>

      </FlexWidget>
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
