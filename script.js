// --- 1. SERVICE WORKER ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(err => console.log('Erreur SW:', err));
    });
}

// --- 2. DONNÉES ---
let db = JSON.parse(localStorage.getItem('ferme_data')) || [];

// --- 3. INITIALISATION ---
// On lance ces fonctions dès que la page est chargée
document.addEventListener('DOMContentLoaded', () => {
    genererOptionsMois();
    rafraichirAffichage();
});

// --- 4. ENREGISTREMENT ---
document.getElementById('btnEnregistrer').addEventListener('click', () => {
    const dateValeur = document.getElementById('dateSaisie').value;
    if (!dateValeur) return alert("Choisis une date !");

    const mDebut = document.getElementById('matinDebut').value;
    const mFin = document.getElementById('matinFin').value;
    const sDebut = document.getElementById('soirDebut').value;
    const sFin = document.getElementById('soirFin').value;

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
    
    genererOptionsMois(); // On met à jour le menu si c'est un nouveau mois
    rafraichirAffichage();
    alert("Journée enregistrée !");
});

// --- 5. LOGIQUE & AFFICHAGE ---
function calculerDifference(debut, fin) {
    if (!debut || !fin) return 0;
    const [hD, mD] = debut.split(':').map(Number);
    const [hF, mF] = fin.split(':').map(Number);
    const diff = (hF * 60 + mF) - (hD * 60 + mD);
    return diff > 0 ? diff / 60 : 0; 
}

function rafraichirAffichage() {
    const totalMoisElement = document.getElementById('totalMois');
    const totalAnneeElement = document.getElementById('totalAnnee');
    const listeElement = document.getElementById('listeHeures');
    const filtre = document.getElementById('selectMois').value;

    const maintenant = new Date();
    const moisActuel = maintenant.toISOString().substring(0, 7);
    const anneeActuelle = maintenant.getFullYear().toString();

    let cumulMois = 0, cumulAnnee = 0;
    listeElement.innerHTML = "";

    db.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Calculs totaux
    db.forEach(j => {
        if (j.date.startsWith(moisActuel)) cumulMois += j.total;
        if (j.date.startsWith(anneeActuelle)) cumulAnnee += j.total;
    });

    // Filtre de la liste
    let aAfficher = db;
    if (filtre === "actuel") aAfficher = db.filter(j => j.date.startsWith(moisActuel));
    else if (filtre !== "tout") aAfficher = db.filter(j => j.date.startsWith(filtre));

    aAfficher.forEach(jour => {
        const div = document.createElement('div');
        div.className = 'jour-item shadow-sm pointer';
        div.innerHTML = `
            <div class="d-flex flex-column">
                <span class="fw-bold text-dark">${jour.date.split('-').reverse().join('/')}</span>
                <small class="text-muted">M: ${jour.matin.deb || '--'} > ${jour.matin.fin || '--'}</small>
            </div>
            <div class="text-end">
                <span class="fw-bold fs-5 d-block text-purple">${jour.total.toFixed(2)}h</span>
                <small class="text-primary" style="font-size: 0.7rem;">Modifier ✏️</small>
            </div>
        `;
        div.onclick = () => {
            document.getElementById('dateSaisie').value = jour.date;
            document.getElementById('matinDebut').value = jour.matin.deb;
            document.getElementById('matinFin').value = jour.matin.fin;
            document.getElementById('soirDebut').value = jour.soir.deb;
            document.getElementById('soirFin').value = jour.soir.fin;
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };
        listeElement.appendChild(div);
    });

    totalMoisElement.textContent = cumulMois.toFixed(2);
    totalAnneeElement.textContent = cumulAnnee.toFixed(2);
}

function genererOptionsMois() {
    const select = document.getElementById('selectMois');
    const moisDispos = [...new Set(db.map(j => j.date.substring(0, 7)))].sort().reverse();
    const current = select.value;
    
    select.innerHTML = '<option value="actuel">Mois en cours</option><option value="tout">Tout l\'historique</option>';
    moisDispos.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = new Date(m + "-01").toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
        select.appendChild(opt);
    });
    select.value = current;
}

// Écouteur pour le menu déroulant
document.getElementById('selectMois').addEventListener('change', rafraichirAffichage);

// --- 6. EXPORT ---
document.getElementById('btnExport').addEventListener('click', () => {
    let csv = "Date;Total\n" + db.map(j => `${j.date};${j.total.toFixed(2)}`).join("\n");
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'heures_ferme.csv';
    a.click();
});