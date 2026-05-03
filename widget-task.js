import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
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
          <TextWidget text="▼ Ingresos" style={{ fontSize: 11, color: '#00FF9D', fontWeight: 'bold' }} />
          <TextWidget text={income} style={{ fontSize: 14, color: '#FFFFFF', fontWeight: 'bold', marginTop: 4 }} />
        </FlexWidget>
        <FlexWidget style={{ flexDirection: 'column', alignItems: 'center' }}>
          <TextWidget text="▲ Gastos" style={{ fontSize: 11, color: '#FF4757', fontWeight: 'bold' }} />
          <TextWidget text={expense} style={{ fontSize: 14, color: '#FFFFFF', fontWeight: 'bold', marginTop: 4 }} />
        </FlexWidget>
      </FlexWidget>
    </FlexWidget>
  );
}

export async function widgetTask() {
  try {
    const { STORE_KEY } = require("./src/constants");
    const raw = await AsyncStorage.getItem(STORE_KEY);
    let balance = "$0";
    let income = "$0";
    let expense = "$0";
    
    if (raw) {
      let state = null;
      try {
        state = JSON.parse(decode(raw));
      } catch (e) {
        state = JSON.parse(raw); // Fallback por si acaso no estaba cifrado
      }
      
      const inc = (state.income || []).reduce((a, b) => a + b.amount, 0);
      const exp = (state.expenses || []).reduce((a, b) => a + b.amount, 0);
      balance = formatMoney(inc - exp);
      income = formatMoney(inc);
      expense = formatMoney(exp);
    }
    
    return {
      props: {
        balance,
        income,
        expense
      }
    };
  } catch (e) {
    return { props: { balance: "--", income: "--", expense: "--" } };
  }
}
