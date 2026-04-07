if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(err => console.log('Erreur SW:', err));
    });
}

let db = JSON.parse(localStorage.getItem('ferme_data')) || [];

// Outil pratique : convertit 4.25 en "4h15"
const formaterHeures = (decimal) => {
    if (!decimal || decimal === 0) return "0h00";
    const h = Math.floor(decimal);
    const m = Math.round((decimal - h) * 60);
    return `${h}h${m < 10 ? "0" + m : m}`;
};

// --- 2. INITIALISATION ---
document.addEventListener('DOMContentLoaded', () => {
    genererOptionsMois();
    rafraichirAffichage();
});

// --- 3. LOGIQUE DE CALCUL ---
function calculerDifference(debut, fin) {
    if (!debut || !fin) return 0;
    const [hD, mD] = debut.split(':').map(Number);
    const [hF, mF] = fin.split(':').map(Number);
    const diff = (hF * 60 + mF) - (hD * 60 + mD);
    return diff > 0 ? diff / 60 : 0; 
}

// --- 4. ENREGISTREMENT ---
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

// --- 5. AFFICHAGE ---
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

        // Filtrage pour l'affichage
        if (filtre === "tout" || (filtre === "actuel" && j.date.startsWith(mActuel)) || j.date.startsWith(filtre)) {
            const div = document.createElement('div');
            div.className = 'jour-item shadow-sm pointer';
            div.innerHTML = `
                <div class="d-flex flex-column">
                    <span class="fw-bold text-dark">${j.date.split('-').reverse().join('/')}</span>
                    <small class="text-muted">M: ${j.matin.deb || '--'}>${j.matin.fin || '--'} | S: ${j.soir.deb || '--'}>${j.soir.fin || '--'}</small>
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

// --- 6. EXPORT ---
document.getElementById('btnExport').addEventListener('click', () => {
    if (db.length === 0) return alert("Rien à exporter !");
    let csv = "sep=;\nDate;Matin;Soir;Heures (Décimal);Heures (Normal)\n"; 
    db.forEach(j => {
        const matin = `${j.matin.deb || ''}-${j.matin.fin || ''}`, soir = `${j.soir.deb || ''}-${j.soir.fin || ''}`;
        csv += `${j.date};${matin};${soir};${j.total.toFixed(2).replace('.', ',')};${formaterHeures(j.total)}\n`;
    });
    const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `heures_ferme_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.csv`;
    a.click();
});