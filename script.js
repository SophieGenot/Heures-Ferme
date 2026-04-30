if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(err => console.log('Erreur SW:', err));
    });
}

let db = JSON.parse(localStorage.getItem('ferme_data')) || [];
// convertit 4.25 en "4h15"
const formaterHeures = (decimal) => {
    if (!decimal || decimal === 0) return "0h00";
    const h = Math.floor(decimal);
    const m = Math.round((decimal - h) * 60);
    return `${h}h${m < 10 ? "0" + m : m}`;
};
// --- INITIALISATION ---
document.addEventListener('DOMContentLoaded', () => {
    genererOptionsMois();
    rafraichirAffichage();
});
// --- LOGIQUE DE CALCUL ---
function calculerDifference(debut, fin) {
    if (!debut || !fin) return 0;
    const [hD, mD] = debut.split(':').map(Number);
    const [hF, mF] = fin.split(':').map(Number);
    const diff = (hF * 60 + mF) - (hD * 60 + mD);
    return diff > 0 ? diff / 60 : 0; 
}

// --- ENREGISTREMENT ---
document.getElementById('btnEnregistrer').addEventListener('click', () => {
    const dateValeur = document.getElementById('dateSaisie').value;
    if (!dateValeur) return alert("Choisis une date !");

    const mDebut = document.getElementById('matinDebut').value, mFin = document.getElementById('matinFin').value;
    const sDebut = document.getElementById('soirDebut').value, sFin = document.getElementById('soirFin').value;

    const durMatin = calculerDifference(mDebut, mFin);
    const durSoir = calculerDifference(sDebut, sFin);
    const total = durMatin + durSoir;

    if (total === 0) return alert("Remplis au moins une plage complète.");

    const nouvelleSaisie = {
        date: dateValeur,
        matin: { deb: mDebut, fin: mFin, dur: durMatin },
        soir: { deb: sDebut, fin: sFin, dur: durSoir },
        total: total
    };

    db = db.filter(j => j.date !== dateValeur);
    db.push(nouvelleSaisie);
    localStorage.setItem('ferme_data', JSON.stringify(db));
    
    genererOptionsMois();
    rafraichirAffichage();
    alert("Journée enregistrée ! 🐮");
});

// --- AFFICHAGE ---
function rafraichirAffichage() {
    const totalMoisElt = document.getElementById('totalMois'), totalAnneeElt = document.getElementById('totalAnnee');
    const listeElt = document.getElementById('listeHeures'), filtre = document.getElementById('selectMois').value;

    const mActuel = new Date().toISOString().substring(0, 7);
    const aActuelle = new Date().getFullYear().toString();

    let cumulMois = 0, cumulAnnee = 0;
    listeElt.innerHTML = "";
    db.sort((a, b) => new Date(b.date) - new Date(a.date));

    db.forEach(j => {
        if (j.date.startsWith(mActuel)) cumulMois += j.total;
        if (j.date.startsWith(aActuelle)) cumulAnnee += j.total;

        // Filtrage affichage
        if (filtre === "tout" || (filtre === "actuel" && j.date.startsWith(mActuel)) || j.date.startsWith(filtre)) {
            const div = document.createElement('div');
            div.className = 'jour-item shadow-sm pointer';
            
            // Historique
            div.innerHTML = `
                <div class="d-flex flex-column">
                    <span class="fw-bold text-dark">${j.date.split('-').reverse().join('/')}</span>
                    <small class="text-muted">M: ${j.matin.deb || '--'} > ${j.matin.fin || '--'}</small>
                    <small class="text-muted">S: ${j.soir.deb || '--'} > ${j.soir.fin || '--'}</small>
                </div>
                <div class="text-end">
                    <span class="fw-bold fs-5 d-block text-purple">${formaterHeures(j.total)}</span>
                    <small class="text-primary" style="font-size: 0.7rem;">Modifier ✏️</small>
                </div>`;

            div.onclick = () => {
                document.getElementById('dateSaisie').value = j.date;
                document.getElementById('matinDebut').value = j.matin.deb;
                document.getElementById('matinFin').value = j.matin.fin;
                document.getElementById('soirDebut').value = j.soir.deb;
                document.getElementById('soirFin').value = j.soir.fin;
                window.scrollTo({ top: 0, behavior: 'smooth' });
            };
            listeElt.appendChild(div);
        }
    });
    totalMoisElt.textContent = formaterHeures(cumulMois);
    totalAnneeElt.textContent = formaterHeures(cumulAnnee);
}

function genererOptionsMois() {
    const select = document.getElementById('selectMois'), current = select.value;
    const moisDispos = [...new Set(db.map(j => j.date.substring(0, 7)))].sort().reverse();
    
    select.innerHTML = '<option value="actuel">Mois en cours</option><option value="tout">Tout l\'historique</option>';
    moisDispos.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = new Date(m + "-01").toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
        select.appendChild(opt);
    });
    select.value = current || "actuel";
}

document.getElementById('selectMois').addEventListener('change', rafraichirAffichage);

// ---  EXPORT ---
// ---  EXPORT PDF ---
document.getElementById('btnExport').addEventListener('click', () => {
    if (db.length === 0) return alert("Rien à exporter !");

    // 1. Préparation des données de temps
    const maintenant = new Date();
    const nomMois = maintenant.toLocaleString('fr-FR', { month: 'long' });
    const annee = maintenant.getFullYear();
    const mActuel = maintenant.toISOString().substring(0, 7);
    const aActuelle = annee.toString();

    // 2. Tri et calcul des lignes
    const dbTriee = [...db].sort((a, b) => new Date(a.date) - new Date(b.date));

    let cumulMois = 0, cumulAnnee = 0;
    let rowsHtml = "";

    dbTriee.forEach(j => {
        // On cumule les totaux
        if (j.date.startsWith(mActuel)) cumulMois += j.total;
        if (j.date.startsWith(aActuelle)) cumulAnnee += j.total;

        // On construit la ligne du tableau
        rowsHtml += `
            <tr>
                <td>${j.date.split('-').reverse().join('/')}</td>
                <td>${j.matin.deb || '--'}</td>
                <td>${j.matin.fin || '--'}</td>
                <td>${j.soir.deb || '--'}</td>
                <td>${j.soir.fin || '--'}</td>
                <td>${j.total.toFixed(2).replace('.', ',')}</td>
                <td class="bold">${formaterHeures(j.total)}</td>
            </tr>`;
    });

    // 3. Appel de la fonction template avec les bonnes données
    const renduFinal = genererTemplatePDF({
        rows: rowsHtml,
        mois: nomMois,
        annee: annee,
        totalMoisDec: cumulMois.toFixed(2).replace('.', ','),
        totalMoisHeures: formaterHeures(cumulMois),
        totalAnneeDec: cumulAnnee.toFixed(2).replace('.', ','),
        totalAnneeHeures: formaterHeures(cumulAnnee)
    });

    // 4. Ouverture de la fenêtre d'impression
    const win = window.open('', '_blank');
    if (win) {
        win.document.write(renduFinal);
        win.document.close();
    } else {
        alert("Veuillez autoriser les pop-ups pour afficher le rapport.");
    }
});

// --- FONCTION TEMPLATE (À mettre bien en dehors du clic, en bas du fichier) ---
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