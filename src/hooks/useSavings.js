import { useState } from "react";
import { useFinance } from "../context/FinanceContext";

export function useSavings() {
  const { appState, updateState, addExpenseWithStreak } = useFinance();
  const pockets = appState?.savingsPockets || [];
  const [loading, setLoading] = useState(false);

  const depositPocket = async (pocketId, amount, isRegistered, desc) => {
    if (amount <= 0) throw new Error("Monto inválido");
    
    const newPockets = pockets.map(p => {
      if (p.id === pocketId) {
        const newTx = {
          id: Date.now().toString(),
          desc: desc || "Abono",
          amount: amount,
          date: new Date().toISOString().split("T")[0],
          isRegistered
        };
        return { 
          ...p, 
          amount: (p.amount || 0) + amount,
          transactions: [newTx, ...(p.transactions || [])]
        };
      }
      return p;
    });
    
    updateState({ savingsPockets: newPockets });
    
    if (isRegistered && addExpenseWithStreak) {
      addExpenseWithStreak({
        id: "exp_" + Date.now(),
        amount: amount,
        cat: "Ahorro",
        date: new Date().toISOString().split("T")[0],
        desc: desc || ("Abono a bolsillo: " + (pockets.find(p => p.id === pocketId)?.name || "")),
      });
    }
  };

  const withdrawPocket = async (pocketId, amount, isRegistered, desc) => {
    if (amount <= 0) throw new Error("Monto inválido");
    
    const newPockets = pockets.map(p => {
      if (p.id === pocketId) {
        if ((p.amount || 0) < amount) throw new Error("Fondos insuficientes");
        const newTx = {
          id: Date.now().toString(),
          desc: desc || "Retiro",
          amount: -amount,
          date: new Date().toISOString().split("T")[0],
          isRegistered
        };
        return { 
          ...p, 
          amount: (p.amount || 0) - amount,
          transactions: [newTx, ...(p.transactions || [])]
        };
      }
      return p;
    });
    updateState({ savingsPockets: newPockets });

    if (isRegistered) {
      const incs = appState?.income || [];
      updateState({
        income: [...incs, {
          id: "inc_" + Date.now(),
          amount: amount,
          type: "variable",
          desc: desc || ("Retiro de bolsillo: " + (pockets.find(p => p.id === pocketId)?.name || "")),
        }]
      });
    }
  };

  const createPocket = async (data) => {
    const newPocket = {
      id: "pocket_" + Date.now(),
      name: data.name,
      category: data.category || "General",
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

  const transfer = async (fromId, toId, amount) => {
    if (amount <= 0) throw new Error("Monto inválido");
    const from = pockets.find(p => p.id === fromId);
    if (!from || (from.amount || 0) < amount) throw new Error("Fondos insuficientes");
    const newPockets = pockets.map(p => {
      if (p.id === fromId) return { ...p, amount: (p.amount || 0) - amount };
      if (p.id === toId) return { ...p, amount: (p.amount || 0) + amount };
      return p;
    });
    updateState({ savingsPockets: newPockets });
  };

  return { pockets, loading, depositPocket, withdrawPocket, transfer, createPocket, deletePocket, totalSaved };
}
