// --- FONCTION TEMPLATE ---
function genererTemplatePDF(d) {
    return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <title>Export Heures ${d.mois} ${d.annee}</title>
        <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; color: #333; line-height: 1.4; }
            header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #6f42c1; padding-bottom: 10px; }
            h1 { color: #6f42c1; text-transform: uppercase; margin: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 0.9em; }
            th, td { border: 1px solid #dee2e6; padding: 10px; text-align: center; }
            th { background-color: #6f42c1; color: white; text-transform: uppercase; font-size: 0.85em; }
            tr:nth-child(even) { background-color: #f8f9fa; }
            .bold { font-weight: bold; color: #6f42c1; }
            .summary-box { margin-top: 30px; display: flex; justify-content: flex-end; }
            .summary-table { width: auto; min-width: 350px; border: 2px solid #6f42c1; }
            .summary-table td { text-align: right; padding: 10px 15px; border: none; border-bottom: 1px solid #eee; }
            .summary-table .label { text-align: left; font-weight: bold; background: #f4f0fa; color: #6f42c1; }
            .no-print-zone { text-align: center; margin-top: 50px; }
            button { background: #6f42c1; color: white; border: none; padding: 12px 25px; border-radius: 5px; cursor: pointer; font-size: 16px; font-weight: bold; }
            @media print {
                .no-print-zone { display: none; }
                body { padding: 0; }
            }
        </style>
    </head>
    <body>
        <header>
            <h1>Rapport d'Activité</h1>
            <p>Période : <strong>${d.mois.toUpperCase()} ${d.annee}</strong></p>
        </header>

        <table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Matin Début</th>
                    <th>Matin Fin</th>
                    <th>Soir Début</th>
                    <th>Soir Fin</th>
                    <th>Total (Déc.)</th>
                    <th>Total (H)</th>
                </tr>
            </thead>
            <tbody>
                ${d.rows}
            </tbody>
        </table>

        <div class="summary-box">
            <table class="summary-table">
                <tr>
                    <td class="label">Total du mois (${d.mois})</td>
                    <td>${d.totalMoisDec} h</td>
                    <td class="bold">${d.totalMoisHeures}</td>
                </tr>
                <tr>
                    <td class="label">Total de l'année (${d.annee})</td>
                    <td>${d.totalAnneeDec} h</td>
                    <td class="bold">${d.totalAnneeHeures}</td>
                </tr>
            </table>
        </div>

        <div class="no-print-zone">
            <button onclick="window.print()">📄 Générer le PDF / Imprimer</button>
        </div>
    </body>
    </html>`;
}