import React from 'react';
import { FlexWidget, TextWidget, ListWidget } from 'react-native-android-widget';
import AsyncStorage from "@react-native-async-storage/async-storage";

export function FynxWidget({ score = "0", balance = "$0" }) {
  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#1C1C24',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'column',
      }}
    >
      <TextWidget text="Fynx Elite" style={{ fontSize: 16, color: '#00FF9D', fontWeight: 'bold' }} />
      <FlexWidget style={{ marginTop: 8 }}>
        <TextWidget text="Score:" style={{ fontSize: 12, color: '#A0A0A0' }} />
        <TextWidget text={score} style={{ fontSize: 24, color: '#FFFFFF', fontWeight: 'bold' }} />
      </FlexWidget>
      <FlexWidget style={{ marginTop: 8 }}>
        <TextWidget text="Balance EOM:" style={{ fontSize: 12, color: '#A0A0A0' }} />
        <TextWidget text={balance} style={{ fontSize: 16, color: '#00FF9D', fontWeight: 'bold' }} />
      </FlexWidget>
    </FlexWidget>
  );
}

export async function widgetTask() {
  try {
    const raw = await AsyncStorage.getItem("@fynx_appstate");
    let score = "--";
    let balance = "$0";
    if (raw) {
      const state = JSON.parse(raw);
      const inc = (state.income || []).reduce((a, b) => a + b.amount, 0);
      const exp = (state.expenses || []).reduce((a, b) => a + b.amount, 0);
      balance = "$" + (inc - exp).toLocaleString();
      score = "85"; // Simplified calculation for widget
    }
    return {
      props: {
        score,
        balance
      }
    };
  } catch (e) {
    return { props: { score: "--", balance: "--" } };
  }
}
