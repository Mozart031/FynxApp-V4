import React from 'react';
import { FlexWidget, TextWidget, requestWidgetUpdate } from 'react-native-android-widget';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { decode } from "./src/utils/security";
import { score } from "./src/utils/finance";

const formatMoney = (amount, cur = "$") => {
  return cur + Math.round(amount).toLocaleString('en-US');
};

export function FynxWidget({ balance = "$0", income = "$0", expense = "$0", scoreTotal = 1000, scoreGrade = "AAA" }) {
  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#0A0A0A', // Pure Black
        borderRadius: 24,
        padding: 20,
        flexDirection: 'column',
        justifyContent: 'space_between',
        borderWidth: 1.5,
        borderColor: '#40D4AF37', // 25% Gold Border
      }}
    >
      {/* Header */}
      <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space_between', alignItems: 'center' }}>
        <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
           <FlexWidget style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#D4AF37', marginRight: 8 }} />
           <TextWidget text="FYNX ELITE" style={{ fontSize: 11, color: '#D4AF37', fontWeight: 'bold', letterSpacing: 2 }} />
        </FlexWidget>
        <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A4AFFE7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#404AFFE7' }}>
           <TextWidget text={scoreGrade} style={{ fontSize: 10, color: '#4AFFE7', fontWeight: 'bold' }} />
        </FlexWidget>
      </FlexWidget>

      {/* Balance Centrado */}
      <FlexWidget style={{ flexDirection: 'column', alignItems: 'center', marginVertical: 12 }}>
        <TextWidget text="BALANCE TOTAL" style={{ fontSize: 10, color: '#A0A0A0', letterSpacing: 1, marginBottom: 4 }} />
        <TextWidget text={balance} style={{ fontSize: 34, color: '#FFFFFF', fontWeight: 'bold' }} />
      </FlexWidget>

      {/* Row de Income / Expense */}
      <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space_between' }}>
        
        <FlexWidget style={{ flex: 1, flexDirection: 'column', alignItems: 'center', backgroundColor: '#111111', borderRadius: 12, padding: 10, marginRight: 6, borderWidth: 1, borderColor: '#333333' }}>
          <TextWidget text="ENTRADAS" style={{ fontSize: 9, color: '#D4AF37', fontWeight: 'bold', letterSpacing: 1 }} />
          <TextWidget text={income} style={{ fontSize: 14, color: '#FFFFFF', fontWeight: 'bold', marginTop: 2 }} />
        </FlexWidget>

        <FlexWidget style={{ flex: 1, flexDirection: 'column', alignItems: 'center', backgroundColor: '#111111', borderRadius: 12, padding: 10, marginLeft: 6, borderWidth: 1, borderColor: '#333333' }}>
          <TextWidget text="SALIDAS" style={{ fontSize: 9, color: '#4AFFE7', fontWeight: 'bold', letterSpacing: 1 }} />
          <TextWidget text={expense} style={{ fontSize: 14, color: '#FFFFFF', fontWeight: 'bold', marginTop: 2 }} />
        </FlexWidget>

      </FlexWidget>
    </FlexWidget>
  );
}

export async function widgetTask({ widgetAction, widgetInfo } = {}) {
  // Solo actualizar si es requerido por el sistema
  if (widgetAction && !['WIDGET_ADDED', 'WIDGET_UPDATE', 'WIDGET_RESIZED'].includes(widgetAction)) {
    return;
  }

  const STORE_KEY = "mifinanzas_v7";
  let balance = "$0";
  let income  = "$0";
  let expense = "$0";
  let scoreTotal = 1000;
  let scoreGrade = "AAA";

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
        const inc = (state.income   || []).reduce((a, b) => a + (b.amount || 0), 0);
        const exp = (state.expenses || []).reduce((a, b) => a + (b.amount || 0), 0);
        balance = formatMoney(inc - exp, cur);
        income  = formatMoney(inc, cur);
        expense = formatMoney(exp, cur);

        const sc = score(state.expenses || [], inc, state.budgets || {}, state.streakDays || [], []);
        scoreTotal = sc.total;
        scoreGrade = sc.grade.label;
      }
    }
  } catch (e) {
    console.warn("[FynxWidget] Error leyendo AsyncStorage:", e);
  }

  try {
    requestWidgetUpdate({
      widgetName: 'FynxWidget',
      renderWidget: () => <FynxWidget balance={balance} income={income} expense={expense} scoreTotal={scoreTotal} scoreGrade={scoreGrade} />,
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
