import { useState, useEffect } from "react";
import { collection, onSnapshot, doc, writeBatch, increment, serverTimestamp, setDoc } from "firebase/firestore";
import { getDb } from "../services/firebase";

export function useSavings(uid) {
  const [pockets, setPockets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }
    const db = getDb();
    if (!db) {
      setLoading(false);
      return;
    }
    const unsub = onSnapshot(
      collection(db, `users/${uid}/savings`),
      (snap) => {
        setPockets(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (error) => {
        console.warn("Error fetching savings:", error);
        setLoading(false);
      }
    );
    return unsub;
  }, [uid]);

  const transfer = async (pocketId, amount, userBalance) => {
    if (!uid) throw new Error("No autenticado");
    if (amount <= 0 || amount > userBalance) throw new Error("Monto inválido o balance insuficiente");
    
    const db = getDb();
    if (!db) throw new Error("Base de datos no disponible");

    const batch = writeBatch(db);
    
    // 1. Restar del balance principal
    const userRef = doc(db, `users/${uid}`);
    batch.update(userRef, { balance: increment(-amount) });
    
    // 2. Sumar al bolsillo
    const pocketRef = doc(db, `users/${uid}/savings/${pocketId}`);
    batch.update(pocketRef, { amount: increment(amount) });
    
    // 3. Registrar transacción en subcolección
    const txRef = doc(collection(db, `users/${uid}/savings/${pocketId}/transactions`));
    batch.set(txRef, {
      date: new Date().toISOString().split("T")[0],
      desc: "Transferencia desde balance",
      amount: amount,
      createdAt: serverTimestamp(),
    });
    
    await batch.commit();
  };

  const createPocket = async (data) => {
    if (!uid) throw new Error("No autenticado");
    const db = getDb();
    if (!db) throw new Error("Base de datos no disponible");
    
    const pocketRef = doc(collection(db, `users/${uid}/savings`));
    await setDoc(pocketRef, {
      name: data.name,
      category: data.category || "General",
      target: parseFloat(data.target) || 0,
      amount: 0,
      color: data.color || "#D4AF37",
      icon: data.icon || "wallet",
      createdAt: serverTimestamp()
    });
  };

  const totalSaved = pockets.reduce((s, p) => s + (p.amount || 0), 0);

  return { pockets, loading, transfer, createPocket, totalSaved };
}
