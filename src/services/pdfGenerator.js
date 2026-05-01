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
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800;900&display=swap');
        * { box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; background-color: #080808; color: #FFFFFF; padding: 50px; margin: 0; background-image: radial-gradient(circle at 50% 0%, #1a1500 0%, #080808 60%); }
        
        /* HEADER */
        .header { display: flex; justify-content: space-between; align-items: flex-end; padding-bottom: 25px; border-bottom: 1px solid rgba(212, 175, 55, 0.2); margin-bottom: 40px; }
        .logo-container { display: flex; flex-direction: column; }
        .logo { font-size: 38px; font-weight: 900; color: #D4AF37; letter-spacing: -1px; margin: 0; line-height: 1; text-shadow: 0 0 20px rgba(212, 175, 55, 0.4); }
        .logo-sub { font-size: 10px; color: #D4AF37; letter-spacing: 4px; text-transform: uppercase; margin-top: 4px; opacity: 0.8; }
        
        .user-info { text-align: right; }
        .title { font-size: 16px; font-weight: 600; color: #E0E0E0; margin-bottom: 4px; }
        .subtitle { font-size: 12px; color: #888888; font-family: monospace; }
        
        /* SUMMARY CARDS */
        .summary-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 45px; }
        .card { background: linear-gradient(145deg, #111111 0%, #0a0a0a 100%); border: 1px solid rgba(212, 175, 55, 0.15); border-radius: 16px; padding: 25px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); position: relative; overflow: hidden; }
        .card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, #D4AF37, transparent); opacity: 0.5; }
        .card-title { font-size: 11px; color: #888888; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px; font-weight: 600; }
        .card-value { font-size: 28px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px; }
        .card-value.income { color: #00FF9D; text-shadow: 0 0 15px rgba(0, 255, 157, 0.2); }
        .card-value.expense { color: #FF4A4A; text-shadow: 0 0 15px rgba(255, 74, 74, 0.2); }
        .card-value.balance { color: #D4AF37; text-shadow: 0 0 15px rgba(212, 175, 55, 0.2); }

        /* SECTIONS & TABLES */
        .section-title { font-size: 14px; font-weight: 800; color: #D4AF37; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 20px; display: flex; align-items: center; }
        .section-title::after { content: ''; flex: 1; height: 1px; background: rgba(212, 175, 55, 0.15); margin-left: 15px; }
        
        .table-container { background: #0a0a0a; border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 16px; overflow: hidden; margin-bottom: 45px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 16px 20px; text-align: left; }
        th { background-color: rgba(255, 255, 255, 0.02); color: #888888; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
        td { font-size: 13px; color: #E0E0E0; border-bottom: 1px solid rgba(255, 255, 255, 0.03); font-weight: 400; }
        tr:last-child td { border-bottom: none; }
        
        .text-right { text-align: right; }
        .cat-name { font-weight: 600; color: #FFFFFF; display: flex; align-items: center; gap: 10px; }
        
        /* BARS */
        .bar-bg { width: 100px; height: 6px; background: #222; border-radius: 3px; overflow: hidden; display: inline-block; vertical-align: middle; margin-left: 10px; }
        .bar-fill { height: 100%; background: #D4AF37; border-radius: 3px; }
        
        .date-col { color: #888888; font-family: monospace; font-size: 11px; }
        .desc-col { font-weight: 500; }
        .amount-col { font-family: monospace; font-size: 14px; font-weight: 600; }

        /* FOOTER */
        .footer { text-align: center; margin-top: 60px; padding-top: 20px; border-top: 1px dashed rgba(255, 255, 255, 0.1); }
        .footer p { font-size: 10px; color: #666666; margin: 5px 0; letter-spacing: 0.5px; }
        .footer-logo { font-size: 14px; font-weight: 900; color: #D4AF37; letter-spacing: 2px; opacity: 0.5; margin-bottom: 10px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo-container">
          <h1 class="logo">FYNX</h1>
          <div class="logo-sub">Elite Intelligence</div>
        </div>
        <div class="user-info">
          <div class="title">REPORTE FINANCIERO EJECUTIVO</div>
          <div class="subtitle">ID: ${user.name || user.email || "Usuario Fynx"} | FECHA: ${new Date().toLocaleDateString('es-DO')}</div>
        </div>
      </div>

      <div class="summary-cards">
        <div class="card">
          <div class="card-title">Ingresos Totales</div>
          <div class="card-value income">${money(totalInc, cur)}</div>
        </div>
        <div class="card">
          <div class="card-title">Gastos Totales</div>
          <div class="card-value expense">${money(totalExp, cur)}</div>
        </div>
        <div class="card">
          <div class="card-title">Balance Neto</div>
          <div class="card-value balance">${money(balance, cur)}</div>
        </div>
      </div>

      <div class="section-title">Análisis de Categorías</div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Categoría</th>
              <th class="text-right">Proporción de Gasto</th>
              <th class="text-right">Monto Invertido</th>
            </tr>
          </thead>
          <tbody>
            ${sortedCats.length > 0 ? sortedCats.map(([cat, amount]) => {
              const pct = totalExp > 0 ? Math.round((amount/totalExp)*100) : 0;
              return '<tr><td class="cat-name">' + cat + '</td>' +
                '<td class="text-right"><span style="font-family: monospace; font-size: 11px; color: #888;">' + pct + '%</span>' +
                '<div class="bar-bg"><div class="bar-fill" style="width: ' + pct + '%;"></div></div></td>' +
                '<td class="text-right amount-col" style="color: #E0E0E0;">' + money(amount, cur) + '</td></tr>';
            }).join('') : '<tr><td colspan="3" style="text-align:center; color: #666; padding: 30px;">No hay registros suficientes</td></tr>'}
          </tbody>
        </table>
      </div>

      <div class="section-title">Registro de Transacciones Recientes</div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Fecha de Operación</th>
              <th>Concepto / Descripción</th>
              <th class="text-right">Impacto Financiero</th>
            </tr>
          </thead>
          <tbody>
            ${expenses.slice(0, 15).map(e => 
              '<tr><td class="date-col">' + new Date(e.id).toLocaleDateString('es-DO', {day: '2-digit', month: 'short', year: 'numeric'}) + '</td>' +
              '<td class="desc-col">' + (e.desc || e.cat) + '</td>' +
              '<td class="text-right amount-col" style="color: #FF4A4A;">-' + money(e.amount, cur) + '</td></tr>'
            ).join('')}
          </tbody>
        </table>
      </div>

      <div class="footer">
        <div class="footer-logo">FYNX</div>
        <p>CONFIDENCIAL. DOCUMENTO GENERADO POR EL MOTOR DE INTELIGENCIA FYNX ELITE.</p>
        <p>TODOS LOS VALORES ESTÁN EXPRESADOS EN LA MONEDA LOCAL CONFIGURADA (${cur}).</p>
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
