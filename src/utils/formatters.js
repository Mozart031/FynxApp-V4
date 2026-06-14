const TODAY         = new Date();
export const DAY          = TODAY.getDate();
export const DAYS_IN_MONTH = new Date(TODAY.getFullYear(), TODAY.getMonth() + 1, 0).getDate();

export function money(n, cur) {
  const c = String(cur || "RD$").toUpperCase();
  return c + " " + Math.abs(Math.round(n)).toLocaleString();
}

export function nlp(text) {
  const low = text.toLowerCase();
  const m   = text.match(/[\d,]+(\.\d+)?/);
  const amount = m ? parseFloat(m[0].replace(",", "")) : null;
  let cat = "Otro";
  if (/gasolina|uber|combustible|transport/.test(low))              cat = "Transporte";
  else if (/comida|supermercado|nacional|bravo|restaurante|almuerzo|cena/.test(low)) cat = "Alimentacion";
  else if (/netflix|spotify|suscripci|disney|amazon/.test(low))      cat = "Suscripciones";
  else if (/farmacia|medic|doctor|salud|pastilla/.test(low))         cat = "Salud";
  else if (/ocio|fiesta|cine|bar|juego/.test(low))                   cat = "Ocio";
  else if (/casa|hogar|alquiler|luz|agua/.test(low))                 cat = "Hogar";
  const today     = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const date = /ayer/.test(low) ? yesterday : today;
  const dm   = text.match(/en\s+(.+?)(\s+hoy|\s+ayer|$)/i);
  const raw  = dm ? dm[1].trim() : cat;
  return { amount, cat, date, desc: raw.charAt(0).toUpperCase() + raw.slice(1) };
}

export function lastNDays(n) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - 1 - i));
    return d.toISOString().split("T")[0];
  });
}

export function weeklyBreakdown(expenses) {
  const weeks = [0, 0, 0, 0, 0];
  expenses.forEach(e => {
    const d = new Date(e.date);
    if (d.getMonth() !== TODAY.getMonth()) return;
    weeks[Math.min(Math.floor((d.getDate() - 1) / 7), 4)] += e.amount;
  });
  return weeks.slice(0, Math.ceil(DAYS_IN_MONTH / 7));
}
