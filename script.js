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

document.getElementById('btnExport').addEventListener('click', () => {
    if (db.length === 0) return alert("Rien à exporter !");

    const maintenant = new Date();
    const nomMois = maintenant.toLocaleString('fr-FR', { month: 'long' });
    const annee = maintenant.getFullYear();

    // Tri des données par date
    const dbTriee = [...db].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calcul des totaux
    const mActuel = maintenant.toISOString().substring(0, 7);
    const aActuelle = annee.toString();
    let cumulMois = 0, cumulAnnee = 0;

    // Construction des lignes du tableau
    let rowsHtml = "";
    dbTriee.forEach(j => {
        if (j.date.startsWith(mActuel)) cumulMois += j.total;
        if (j.date.startsWith(aActuelle)) cumulAnnee += j.total;

        rowsHtml += `
            <tr>
                <td>${j.date.split('-').reverse().join('/')}</td>
                <td>${j.matin.deb || '--'}</td>
                <td>${j.matin.fin || '--'}</td>
                <td>${j.soir.deb || '--'}</td>
                <td>${j.soir.fin || '--'}</td>
                <td class="bold">${formaterHeures(j.total)}</td>
            </tr>`;
    });

    // Création du contenu HTML complet pour le PDF
    const contenuHtml = `
    <html>
    <head>
        <title>Export Heures - ${nomMois} ${annee}</title>
        <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
            h1 { color: #6f42c1; text-align: center; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: center; }
            th { background-color: #6f42c1; color: white; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .bold { font-weight: bold; }
            .totaux-section { margin-top: 30px; border-top: 2px solid #6f42c1; padding-top: 10px; }
            .total-item { font-size: 1.2em; margin-bottom: 5px; }
            .text-purple { color: #6f42c1; font-weight: bold; }
            @media print {
                #btnImprimer { display: none; }
            }
        </style>
    </head>
    <body>
        <h1>Récapitulatif des Heures - ${nomMois.toUpperCase()} ${annee}</h1>
        
        <table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Matin Début</th>
                    <th>Matin Fin</th>
                    <th>Soir Début</th>
                    <th>Soir Fin</th>
                    <th>Total Jour</th>
                </tr>
            </thead>
            <tbody>
                ${rowsHtml}
            </tbody>
        </table>

        <div class="totaux-section">
            <div class="total-item">Total du mois (<b>${nomMois}</b>) : <span class="text-purple">${formaterHeures(cumulMois)}</span></div>
            <div class="total-item">Total cumulé de l'année (<b>${annee}</b>) : <span class="text-purple">${formaterHeures(cumulAnnee)}</span></div>
        </div>

        <div style="margin-top: 40px; text-align: center;">
            <button id="btnImprimer" onclick="window.print()" style="padding: 10px 20px; background: #6f42c1; color: white; border: none; border-radius: 5px; cursor: pointer;">
                Enregistrer en PDF / Imprimer
            </button>
        </div>
    </body>
    </html>`;

    // Ouverture dans un nouvel onglet
    const win = window.open('', '_blank');
    win.document.write(contenuHtml);
    win.document.close();
});