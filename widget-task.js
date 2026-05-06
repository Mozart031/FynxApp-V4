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
        backgroundColor: '#0B0D17',
        borderRadius: 20,
        padding: 16,
        flexDirection: 'column',
        justifyContent: 'space_between',
      }}
    >
      <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space_between', alignItems: 'center' }}>
        <TextWidget text="FYNX RESUMEN" style={{ fontSize: 13, color: '#D4AF37', fontWeight: 'bold', letterSpacing: 1 }} />
      </FlexWidget>

      <FlexWidget style={{ flexDirection: 'column', alignItems: 'center', marginVertical: 8 }}>
        <TextWidget text="Balance Disponible" style={{ fontSize: 13, color: '#A0A0A0' }} />
        <TextWidget text={balance} style={{ fontSize: 32, color: '#FFFFFF', fontWeight: 'bold' }} />
      </FlexWidget>

      <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space_evenly', backgroundColor: '#181A25', borderRadius: 12, padding: 12 }}>
        <FlexWidget style={{ flexDirection: 'column', alignItems: 'center' }}>
          <TextWidget text="Ingresos" style={{ fontSize: 11, color: '#00FF9D', fontWeight: 'bold' }} />
          <TextWidget text={income} style={{ fontSize: 14, color: '#FFFFFF', fontWeight: 'bold', marginTop: 4 }} />
        </FlexWidget>
        <FlexWidget style={{ flexDirection: 'column', alignItems: 'center' }}>
          <TextWidget text="Gastos" style={{ fontSize: 11, color: '#FF4757', fontWeight: 'bold' }} />
          <TextWidget text={expense} style={{ fontSize: 14, color: '#FFFFFF', fontWeight: 'bold', marginTop: 4 }} />
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
