let leMotAleatoire = ""; // Initialisation de la variable
let motATrouver = ""; // Déclaration de la variable en dehors de la fonction
let positionActuelle = 1; // La première lettre sera préremplie
let lettresTrouvees = []; // Tableau pour les lettres trouvées
let essaisMax = 6; // Nombre d'essais maximum
let essaisActuels = 0; // Compteur d'essais

async function recupererMotATrouver() {
    const response = await fetch("https://trouve-mot.fr/api/sizemax/9");

    if (response.ok) {
        const data = await response.json();
        leMotAleatoire = data[0].name; // Assigner le mot à la variable
        console.log("Mot récupéré :", leMotAleatoire); // Afficher le mot récupéré
    } else {
        console.error("Erreur lors de la récupération du mot :", response.status);
        return null; // Retourne null en cas d'erreur
    }
}

// Fonction pour initialiser le jeu
function initialiserJeu() {
    positionActuelle = 1; // Réinitialiser la position
    console.log(positionActuelle)
    essaisActuels = 0; // Réinitialiser le compteur d'essais
    lettresTrouvees = []; // Réinitialiser les lettres trouvées
    document.getElementById("nb-essais").innerText = essaisMax; // Remettre le compteur d'essais

    // Effacer la grille précédente
    document.getElementById("grille").innerHTML = "";

    // Réinitialiser le clavier
    const touches = document.querySelectorAll('.touche');
    touches.forEach(touche => {
        touche.classList.remove("touche-invalide"); // Retirer la classe de touche invalide
    });

    // Appeler la fonction pour récupérer un nouveau mot
    recupererMotATrouver().then(() => {
        motATrouver = leMotAleatoire.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
        console.log("Mot à trouver :", motATrouver); // Affiche le mot à trouver

        // Initialiser le jeu après avoir récupéré le mot
        genererCasesMotus(motATrouver);
        attacherEvenementsClavier();
    });
}

document.getElementById("nouveau").addEventListener("click", function() {
    location.reload(); // Rafraîchir la page
});


// Appeler la fonction pour initialiser le jeu au chargement de la page
initialiserJeu();

// Générer une ligne de cases (une grille) pour le mot
function genererCasesMotus(mot, valeurs = []) {
    const conteneur = document.getElementById("grille");

    let nouvelleLigne = document.createElement("div");
    nouvelleLigne.classList.add("ligne-mot"); // Ajouter la classe pour chaque ligne de mots

    for (let i = 0; i < mot.length; i++) {
        let caseVide = document.createElement("input");
        caseVide.setAttribute("type", "text");
        caseVide.setAttribute("maxlength", "1");
        caseVide.classList.add("case-lettre");

        // Préremplir la première lettre
        if (i === 0 || valeurs[i]) {
            caseVide.value = valeurs[i] || mot[0];
            caseVide.disabled = true; // Désactiver les cases déjà remplies
        }

        nouvelleLigne.appendChild(caseVide);
    }

    conteneur.appendChild(nouvelleLigne); // Ajouter la nouvelle ligne en dessous
    positionActuelle = 1; // Réinitialiser la position pour cette ligne (début à 1 car la première lettre est déjà remplie)
}

// Remplir la case avec la lettre cliquée
function remplirCase(lettre) {
    const ligneCourante = document.querySelectorAll('.ligne-mot:last-of-type .case-lettre');
    if (positionActuelle < ligneCourante.length) {
        ligneCourante[positionActuelle].value = lettre.toUpperCase(); // Remplir la case
        positionActuelle++;
    }
}

// Vérifier le mot proposé par l'utilisateur
function validerMot() {
    const ligneCourante = document.querySelectorAll('.ligne-mot:last-of-type .case-lettre');
    let motPropose = "";
    let compteLettre = {}; // Compte des lettres dans le mot à trouver

    // Remplir compteLettre avec les occurrences des lettres dans motATrouver
    for (let lettre of motATrouver) {
        compteLettre[lettre] = (compteLettre[lettre] || 0) + 1;
    }

    // Construire le mot proposé à partir des cases remplies
    ligneCourante.forEach(input => {
        motPropose += input.value;
    });

    // Ne pas valider si tous les inputs ne sont pas remplis
    if (motPropose.length < motATrouver.length) {
        afficherMessageFin("Veuillez remplir toutes les lettres avant de valider.");
        return;
    }

    essaisActuels++;
    document.getElementById("nb-essais").innerText = essaisMax - essaisActuels; // Mettre à jour les essais restants

    // Première passe : vérifier les lettres exactes
    for (let i = 0; i < motPropose.length; i++) {
        if (motPropose[i] === motATrouver[i]) {
            ligneCourante[i].style.backgroundColor = "red"; // Correct et au bon endroit
            lettresTrouvees[i] = motPropose[i]; // Sauvegarder la lettre trouvée
            compteLettre[motPropose[i]]--; // Diminuer le compte pour éviter les doublons en jaune
        }
    }

    // Deuxième passe : vérifier les lettres présentes mais mal placées
    for (let i = 0; i < motPropose.length; i++) {
        if (motPropose[i] !== motATrouver[i] && motATrouver.includes(motPropose[i]) && compteLettre[motPropose[i]] > 0) {
            ligneCourante[i].style.backgroundColor = "orange"; // Présente mais mal placée
            ligneCourante[i].style.borderRadius = "50%"; // Ajoute un fond rond
            compteLettre[motPropose[i]]--; // Diminuer le compte pour éviter les répétitions
        } else if (motPropose[i] !== motATrouver[i] && !motATrouver.includes(motPropose[i])) {
            // Lettre non présente, couleur rose-rouge
            const bouton = document.querySelector(`.touche[data-lettre="${motPropose[i]}"]`);
            if (bouton) {
                bouton.classList.add("touche-invalide"); // Ajouter une classe à la touche invalide
            }
        }
    }

    // Vérifier si le mot est trouvé
    if (motPropose === motATrouver) {
        afficherMessageFin(`Félicitations ! Vous avez trouvé le mot en ${essaisActuels} essai(s) !`);
        return;
    }

    // Vérifier si le nombre d'essais maximum est atteint
    if (essaisActuels >= essaisMax) {
        afficherMessageFin(`Dommage ! Vous n'avez pas trouvé le mot. Le mot était "${motATrouver}".`);
        return;
    }

    // Générer une nouvelle ligne avec les lettres déjà trouvées
    genererCasesMotus(motATrouver, lettresTrouvees);
}

// Effacer la dernière lettre
function effacerDerniereLettre() {
    const ligneCourante = document.querySelectorAll('.ligne-mot:last-of-type .case-lettre');
    if (positionActuelle > 1) {
        positionActuelle--;
        ligneCourante[positionActuelle].value = "";
        ligneCourante[positionActuelle].style.backgroundColor = ""; // Réinitialiser le fond
    }
}

// Afficher un message de fin (gagné ou perdu)
function afficherMessageFin(message) {
    const messageFin = document.getElementById("message-fin");
    messageFin.innerText = message;
    messageFin.style.display = "block"; // Rendre le message visible
}

// Attacher les événements sur les touches du clavier
function attacherEvenementsClavier() {
    const touches = document.querySelectorAll('.touche');

    touches.forEach(touche => {
        touche.addEventListener('click', function() {
            const lettre = this.innerText;

            if (lettre === "Effacer") {
                effacerDerniereLettre(); // Effacer la dernière lettre
            } else if (lettre === "Valider") {
                validerMot(); // Valider le mot proposé
            } else {
                remplirCase(lettre); // Remplir la case avec la lettre
            }
        });
    });
}

// Initialisation des événements pour le clavier
document.querySelectorAll('.touche').forEach(touche => {
    touche.setAttribute('data-lettre', touche.innerText); // Ajouter l'attribut data-lettre
});
