if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(err => console.log('Erreur SW:', err));
    });
}

let db = JSON.parse(localStorage.getItem('ferme_data')) || [];

// Convertit 4.25 en "4h15"
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
        total: total,
        type: "travail" // Type par défaut
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

    const mActuelReel = new Date().toISOString().substring(0, 7);
    const aActuelle = new Date().getFullYear().toString();

    let moisCiblePourCompteur;
    if (filtre === "actuel") {
        moisCiblePourCompteur = mActuelReel;
    } else if (filtre === "tout") {
        moisCiblePourCompteur = db.length > 0 ? db.reduce((max, j) => j.date > max ? j.date : max, db[0].date).substring(0, 7) : mActuelReel;
    } else {
        moisCiblePourCompteur = filtre;
    }

    let cumulMois = 0, cumulAnnee = 0;
    listeElt.innerHTML = "";
    db.sort((a, b) => new Date(b.date) - new Date(a.date));

    db.forEach(j => {
        if (j.date.startsWith(aActuelle)) cumulAnnee += j.total;
        if (j.date.startsWith(moisCiblePourCompteur)) cumulMois += j.total;

        if (filtre === "tout" || (filtre === "actuel" && j.date.startsWith(mActuelReel)) || j.date.startsWith(filtre)) {
            const div = document.createElement('div');
            div.className = 'jour-item shadow-sm pointer';

            // Gestion de l'affichage si c'est un Congé ou un Jour Férié
            if (j.type === "CP" || j.type === "Ferie") {
                const libelleType = j.type === "CP" ? "Congés Payés" : "Jour Férié";
                const badgeColor = j.type === "CP" ? "text-warning" : "text-info";
                
                div.innerHTML = `
                    <div class="d-flex flex-column">
                        <span class="fw-bold text-dark">
                            <span class="${badgeColor} me-1">[${j.type}]</span> ${j.date.split('-').reverse().join('/')}
                        </span>
                        <small class="text-muted">📅 ${libelleType}</small>
                    </div>
                    <div class="text-end">
                        <span class="fw-bold fs-6 text-muted">-</span>
                        <small class="text-danger d-block" style="font-size: 0.7rem;" onclick="event.stopPropagation(); supprimerJour('${j.date}')">Supprimer ❌</small>
                    </div>`;
            } else {
                // Affichage classique jour de travail
                const jourDate = new Date(j.date);
                const initialeJour = jourDate.toLocaleDateString('fr-FR', { weekday: 'narrow' }).toUpperCase();
                
                div.innerHTML = `
                    <div class="d-flex flex-column">
                        <span class="fw-bold text-dark">
                            <span class="text-purple me-1">[${initialeJour}]</span> ${j.date.split('-').reverse().join('/')}
                        </span>
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
            }
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

// --- FONCTION SUPPRESSION JOUR ---
function supprimerJour(dateStr) {
    if (confirm(`Voulez-vous vraiment supprimer l'entrée du ${dateStr.split('-').reverse().join('/')} ?`)) {
        db = db.filter(j => j.date !== dateStr);
        localStorage.setItem('ferme_data', JSON.stringify(db));
        genererOptionsMois();
        rafraichirAffichage();
    }
}

// --- AJOUT PERIODE CONGES / FERIES ---
function ajouterPeriodeConges() {
    const debStr = document.getElementById('congeDebut').value;
    const finStr = document.getElementById('congeFin').value;
    const type = document.getElementById('congeType').value;

    if (!debStr || !finStr) {
        alert("Veuillez sélectionner une date de début et de fin.");
        return;
    }

    let dCourante = new Date(debStr);
    const dFin = new Date(finStr);

    if (dCourante > dFin) {
        alert("La date de début doit être avant ou égale à la date de fin.");
        return;
    }

    while (dCourante <= dFin) {
        const dateIso = dCourante.toISOString().substring(0, 10);
        let index = db.findIndex(j => j.date === dateIso);
        
        const nouvelleEntree = {
            date: dateIso,
            matin: { deb: "", fin: "", dur: 0 },
            soir: { deb: "", fin: "", dur: 0 },
            total: 0,
            type: type // "CP" ou "Ferie"
        };

        if (index >= 0) {
            db[index] = nouvelleEntree;
        } else {
            db.push(nouvelleEntree);
        }

        dCourante.setDate(dCourante.getDate() + 1);
    }

    localStorage.setItem('ferme_data', JSON.stringify(db));
    genererOptionsMois();
    rafraichirAffichage();
    
    document.getElementById('congeDebut').value = '';
    document.getElementById('congeFin').value = '';
    
    alert("Période de congés/fériés ajoutée avec succès ! 🌴");
}

// --- EXPORT PDF ---
document.getElementById('btnExport').addEventListener('click', () => {
    if (db.length === 0) return alert("Rien à exporter !");

    const filtre = document.getElementById('selectMois').value;
    let mActuel;

    if (filtre === "actuel") {
        mActuel = new Date().toISOString().substring(0, 7);
    } else if (filtre === "tout") {
        mActuel = db.reduce((max, j) => j.date > max ? j.date : max, db[0].date).substring(0, 7);
    } else {
        mActuel = filtre;
    }

    const dateReference = new Date(mActuel + "-01");
    const nomMois = dateReference.toLocaleString('fr-FR', { month: 'long' });
    const annee = dateReference.getFullYear();
    const aActuelle = annee.toString();

    const dbTriee = [...db].sort((a, b) => new Date(a.date) - new Date(b.date));

    let cumulMois = 0, cumulAnnee = 0;
    let rowsHtml = "";

    dbTriee.forEach(j => {
        if (j.date.startsWith(aActuelle)) cumulAnnee += j.total;

        if (j.date.startsWith(mActuel)) {
            cumulMois += j.total;

            // Affichage spécifique dans le tableau PDF si c'est un CP ou Férié
            if (j.type === "CP" || j.type === "Ferie") {
                const libelle = j.type === "CP" ? "Congés Payés" : "Jour Férié";
                rowsHtml += `
                    <tr>
                        <td>${j.date.split('-').reverse().join('/')}</td>
                        <td colspan="4" class="text-center italic">${libelle}</td>
                        <td>0,00</td>
                        <td class="bold">0h00</td>
                    </tr>`;
            } else {
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
            }
        }
    });

    if (!rowsHtml) return alert("Aucune donnée à exporter pour ce mois-ci !");

    const renduFinal = genererTemplatePDF({
        rows: rowsHtml,
        mois: nomMois,
        annee: annee,
        totalMoisDec: cumulMois.toFixed(2).replace('.', ','),
        totalMoisHeures: formaterHeures(cumulMois),
        totalAnneeDec: cumulAnnee.toFixed(2).replace('.', ','),
        totalAnneeHeures: formaterHeures(cumulAnnee)
    });

    const win = window.open('', '_blank');
    if (win) {
        win.document.write(renduFinal);
        win.document.close();
    } else {
        alert("Veuillez autoriser les pop-ups pour afficher le rapport.");
    }
});