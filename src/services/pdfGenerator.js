import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { money } from "../utils/formatters";

export const generatePDF = async (appState) => {
  const { user = {}, expenses = [], income = [], score = 0 } = appState;
  
  const totalInc = income.reduce((a, i) => a + i.amount, 0);
  const totalExp = expenses.reduce((a, e) => a + e.amount, 0);
  const balance = totalInc - totalExp;
  const cur = user.currency || "RD$";
  
  // Agrupar gastos por categoría
  const cats = {};
  expenses.forEach(e => { cats[e.cat] = (cats[e.cat] || 0) + e.amount; });
  const sortedCats = Object.entries(cats).sort((a,b) => b[1] - a[1]);

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Fynx Elite - Reporte Financiero</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #000000; color: #FFFFFF; padding: 40px; margin: 0; }
        .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid rgba(255, 215, 0, 0.3); padding-bottom: 20px; }
        .logo { font-size: 32px; font-weight: 900; color: #D4AF37; letter-spacing: -2px; }
        .title { font-size: 24px; font-weight: 700; color: #E0E0E0; margin-top: 10px; }
        .subtitle { font-size: 14px; color: #A0A0A0; margin-top: 5px; }
        
        .summary-cards { display: flex; justify-content: space-between; margin-bottom: 40px; }
        .card { background-color: #0A0A0A; border: 1px solid rgba(212, 175, 55, 0.2); border-radius: 12px; padding: 20px; width: 30%; text-align: center; }
        .card-title { font-size: 12px; color: #A0A0A0; text-transform: uppercase; letter-spacing: 1px; }
        .card-value { font-size: 24px; font-weight: bold; color: #D4AF37; margin-top: 10px; }
        .card-value.income { color: #00FF9D; }
        .card-value.expense { color: #FF4A4A; }

        .section-title { font-size: 18px; font-weight: 600; color: #D4AF37; border-bottom: 1px solid rgba(212, 175, 55, 0.2); padding-bottom: 8px; margin-bottom: 20px; margin-top: 30px; }
        
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        th, td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #262626; }
        th { background-color: #0A0A0A; color: #A0A0A0; font-size: 12px; text-transform: uppercase; }
        td { font-size: 14px; color: #E0E0E0; }
        .text-right { text-align: right; }
        .cat-name { font-weight: 600; color: #FFFFFF; }
        
        .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #606060; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">FYNX ELITE</div>
        <div class="title">Reporte Financiero Mensual</div>
        <div class="subtitle">Usuario: ${user.name || "Usuario Fynx"} | Generado: ${new Date().toLocaleDateString()}</div>
      </div>

      <div class="summary-cards">
        <div class="card">
          <div class="card-title">Ingresos</div>
          <div class="card-value income">${money(totalInc, cur)}</div>
        </div>
        <div class="card">
          <div class="card-title">Gastos</div>
          <div class="card-value expense">${money(totalExp, cur)}</div>
        </div>
        <div class="card">
          <div class="card-title">Balance Neto</div>
          <div class="card-value">${money(balance, cur)}</div>
        </div>
      </div>

      <div class="section-title">Desglose por Categoría</div>
      <table>
        <thead>
          <tr>
            <th>Categoría</th>
            <th class="text-right">Monto</th>
            <th class="text-right">% del Total</th>
          </tr>
        </thead>
        <tbody>
          ${sortedCats.length > 0 ? sortedCats.map(([cat, amount]) => `
            <tr>
              <td class="cat-name">${cat}</td>
              <td class="text-right">${money(amount, cur)}</td>
              <td class="text-right">${totalExp > 0 ? Math.round((amount/totalExp)*100) : 0}%</td>
            </tr>
          `).join('') : '<tr><td colspan="3" style="text-align:center;">No hay gastos registrados</td></tr>'}
        </tbody>
      </table>

      <div class="section-title">Últimos Movimientos</div>
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Descripción</th>
            <th class="text-right">Monto</th>
          </tr>
        </thead>
        <tbody>
          ${expenses.slice(0, 10).map(e => `
            <tr>
              <td>${new Date(e.id).toLocaleDateString()}</td>
              <td>${e.desc || e.cat}</td>
              <td class="text-right">${money(e.amount, cur)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="footer">
        Este documento es generado automáticamente por Fynx Elite. Confidencial.
      </div>
    </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html, base64: false });
    await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf', dialogTitle: 'Compartir Reporte Financiero' });
  } catch (error) {
    console.warn("Error generando PDF:", error);
  }
};
