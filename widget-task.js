import React from 'react';
import { FlexWidget, TextWidget, requestWidgetUpdate } from 'react-native-android-widget';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { decode } from "./src/utils/security";

const formatMoney = (amount) => {
  return "$" + Math.round(amount).toLocaleString('en-US');
};

export function FynxWidget({ balance = "$0", income = "$0", expense = "$0" }) {
  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#080808', // Deep Space Black
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
      </FlexWidget>

      {/* Balance Centrado */}
      <FlexWidget style={{ flexDirection: 'column', alignItems: 'center', marginVertical: 12 }}>
        <TextWidget text="BALANCE TOTAL" style={{ fontSize: 10, color: '#A0A0A0', letterSpacing: 1, marginBottom: 4 }} />
        <TextWidget text={balance} style={{ fontSize: 34, color: '#FFFFFF', fontWeight: 'bold' }} />
      </FlexWidget>

      {/* Row de Income / Expense */}
      <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space_between' }}>
        
        <FlexWidget style={{ flex: 1, flexDirection: 'column', alignItems: 'center', backgroundColor: '#1A00E5B0', borderRadius: 12, padding: 10, marginRight: 6, borderWidth: 1, borderColor: '#3300E5B0' }}>
          <TextWidget text="ENTRADAS" style={{ fontSize: 9, color: '#00E5B0', fontWeight: 'bold', letterSpacing: 1 }} />
          <TextWidget text={income} style={{ fontSize: 14, color: '#FFFFFF', fontWeight: 'bold', marginTop: 2 }} />
        </FlexWidget>

        <FlexWidget style={{ flex: 1, flexDirection: 'column', alignItems: 'center', backgroundColor: '#1AFF4757', borderRadius: 12, padding: 10, marginLeft: 6, borderWidth: 1, borderColor: '#33FF4757' }}>
          <TextWidget text="SALIDAS" style={{ fontSize: 9, color: '#FF4757', fontWeight: 'bold', letterSpacing: 1 }} />
          <TextWidget text={expense} style={{ fontSize: 14, color: '#FFFFFF', fontWeight: 'bold', marginTop: 2 }} />
        </FlexWidget>

      </FlexWidget>
    </FlexWidget>
  );
}

/**
 * [FIX v5.2] widgetTask ahora:
 * 1. Usa requestWidgetUpdate correctamente en lugar de retornar JSX.
 * 2. Soporta las acciones de widget de Android.
 */
export async function widgetTask({ widgetAction, widgetInfo } = {}) {
  // Solo actualizar si es requerido por el sistema
  if (widgetAction && !['WIDGET_ADDED', 'WIDGET_UPDATE', 'WIDGET_RESIZED'].includes(widgetAction)) {
    return;
  }

  const STORE_KEY = "mifinanzas_v7";
  let balance = "$0";
  let income  = "$0";
  let expense = "$0";

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
        const inc = (state.income   || []).reduce((a, b) => a + (b.amount || 0), 0);
        const exp = (state.expenses || []).reduce((a, b) => a + (b.amount || 0), 0);
        balance = formatMoney(inc - exp);
        income  = formatMoney(inc);
        expense = formatMoney(exp);
      }
    }
  } catch (e) {
    console.warn("[FynxWidget] Error leyendo AsyncStorage:", e);
  }

  try {
    requestWidgetUpdate({
      widgetName: 'FynxWidget',
      renderWidget: () => <FynxWidget balance={balance} income={income} expense={expense} />,
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
