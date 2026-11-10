document.addEventListener('DOMContentLoaded', () => {
    // Évite que le pop-up ne se réaffiche en boucle pendant la même session
    if (!sessionStorage.getItem('popup_bienvenue_affiche')) {
        
        // 1. On récupère le numéro du jour (0 = Dimanche, 1 = Lundi, 2 = Mardi...)
        const numeroJour = new Date().getDay();
        
        // 2. On prépare le tableau des messages personnalisés
        const messagesPropres = {
            1: "Courage au plus fort des Poupou",      // Lundi
            2: "Tracteur Néné",     // Mardi
            3: "Bisous sur le Pip", // Mercredi
            4: "Te laisse pas faire par ces gerbeuses d'herbes",         // Jeudi
            5: "Le cailloux c'est le plus musqué des cailloux 🎉",   // Vendredi
            6: "Bon courage mon petit Pipou! ! ☀️",         // Samedi
            0: "Gros bisous sur les fesses du beb"        // Dimanche
        };

        // 3. On sélectionne le bon message (et on prévoit un message de secours au cas où)
        const messageDuJour = messagesPropres[numeroJour] || "Passe une super journée ! 🐮";

        // 4. On affiche l'alerte
        alert(messageDuJour);
        
        // On enregistre que le message a été vu pour cette session
        sessionStorage.setItem('popup_bienvenue_affiche', 'true');
    }
});