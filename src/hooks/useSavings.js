import { useState } from "react";
import { useFinance } from "../context/FinanceContext";

export function useSavings() {
  const { appState, updateState } = useFinance();
  const pockets = appState?.savingsPockets || [];
  const [loading, setLoading] = useState(false);

  const transfer = async (pocketId, amount, userBalance) => {
    if (amount <= 0) throw new Error("Monto inválido");
    
    const newPockets = pockets.map(p => 
      p.id === pocketId ? { ...p, amount: (p.amount || 0) + amount } : p
    );
    updateState({ savingsPockets: newPockets });
  };

  const createPocket = async (data) => {
    const newPocket = {
      id: "pocket_" + Date.now(),
      name: data.name,
      category: data.category || "General",
      target: parseFloat(data.target) || 0,
      amount: 0,
      color: data.color || "#D4AF37",
      icon: data.icon || "wallet",
      createdAt: Date.now()
    };
    updateState({ savingsPockets: [...pockets, newPocket] });
  };

  const deletePocket = async (pocketId) => {
    const newPockets = pockets.filter(p => p.id !== pocketId);
    updateState({ savingsPockets: newPockets });
  };

  const totalSaved = pockets.reduce((s, p) => s + (p.amount || 0), 0);

  return { pockets, loading, transfer, createPocket, deletePocket, totalSaved };
}
