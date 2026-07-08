# ⏱️ Chrono-Ferme (Heures-Ferme)

Une application web de type **PWA (Progressive Web App)**, légère et optimisée "Offline-First", conçue spécialement pour suivre et exporter les heures de travail agricoles de manière simple et intuitive. 

---

### Fonctionnalités

**Offline-First (Mode Hors-ligne) :** L'application fonctionne à 100 % sans connexion internet grâce à un Service Worker performant. Idéal pour les zones blanches à la ferme !
**Suivi des Heures Simplifié :** Saisie rapide des horaires du matin et du soir avec calcul automatisé du total quotidien.
**Cumul Dynamique :** Affichage instantané du total des heures par mois ou par année en fonction du filtre sélectionné.
**Historique Clair :** Visualisation de l'historique complet avec l'initiale du jour de la semaine (ex: `[L]`, `[M]`...) pour un repérage visuel rapide.
**Édition Facile :** Modification ou correction d'une saisie passée en un seul clic.
**Export PDF :** Génération de rapports d'activité propres et formatés pour faciliter les démarches administratives.

---

### Technologies Utilisées

**HTML5 & CSS3** (Architecture responsive et épurée)
**JavaScript (ES6+)** (Logique métier, manipulation du DOM, API Date)
**Bootstrap 5** (Framework CSS pour une interface mobile-first et moderne)
**Service Worker** (Gestion du cache local et du comportement PWA)
**LocalStorage / SessionStorage** (Persistance des données utilisateur directement sur l'appareil)

---

### Installation & Utilisation Locale

### Prérequis
Un navigateur web moderne (Chrome, Safari, Edge, Firefox).

### Lancement
1. Clonez le repository :
   ```bash
   git clone [https://github.com/sophiegenot/Heures-Ferme.git](https://github.com/sophiegenot/Heures-Ferme.git)