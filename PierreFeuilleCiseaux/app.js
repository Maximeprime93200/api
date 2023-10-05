const express = require('express');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const bodyParser = require('body-parser');
const uuid = require('uuid');
const fs = require('fs');

const app = express();

app.use(bodyParser.json());

app.use(session({
  genid: (req) => {
    return uuid.v4(); // Utilisez UUID comme identifiant de session
  },
  store: new FileStore({
    path: './sessions', // Répertoire où les sessions seront stockées
  }),
  secret: 'votre_secret_session', // Clé secrète pour les sessions
  resave: false,
  saveUninitialized: true,
}));

// Créez un tableau pour stocker les parties
const parties = [];

// Endpoint pour créer un compte utilisateur
app.post('/utilisateur/inscription', (req, res) => {
  const { username, password } = req.body;

  // Chargez les utilisateurs depuis le fichier db.json
  const dbData = JSON.parse(fs.readFileSync('db.json'));

  // Vérifiez si l'utilisateur existe déjà
  const existingUser = dbData.users.find((user) => user.username === username);
  if (existingUser) {
    return res.status(400).json({ message: "L'utilisateur existe déjà." });
  }

  // Créez un nouvel utilisateur
  const newUser = {
    id: uuid.v4(),
    username,
    password,
  };

  // Ajoutez le nouvel utilisateur à la liste des utilisateurs
  dbData.users.push(newUser);

  // Enregistrez les modifications dans le fichier db.json
  fs.writeFileSync('db.json', JSON.stringify(dbData, null, 2));

  res.json({ message: 'Compte utilisateur créé avec succès.' });
});

// Endpoint pour s'authentifier
app.post('/utilisateur/connexion', (req, res) => {
  const { username, password } = req.body;

  // Chargez les utilisateurs depuis le fichier db.json
  const dbData = JSON.parse(fs.readFileSync('db.json'));

  // Recherchez l'utilisateur par nom d'utilisateur et mot de passe
  const user = dbData.users.find((user) => user.username === username && user.password === password);

  if (!user) {
    return res.status(401).json({ message: 'Nom d\'utilisateur ou mot de passe incorrect.' });
  }

  // Stockez l'ID de l'utilisateur dans la session
  req.session.userId = user.id;

  res.json({ message: 'Connecté avec succès', userId: user.id });
});

// Endpoint pour créer une nouvelle partie
app.post('/jeu/creer-partie', (req, res) => {
  // Vérifiez si l'utilisateur est connecté (vous devrez peut-être ajuster cela en fonction de votre logique d'authentification)
  const userId = req.session.userId;
  if (!userId) {
    return res.status(401).json({ message: 'Vous devez être connecté pour créer une partie.' });
  }

  // Chargez les données depuis le fichier db.json
  const dbData = JSON.parse(fs.readFileSync('db.json'));

  // Créez une nouvelle partie
  const nouvellePartie = {
    id: uuid.v4(),
    createur: userId, // L'ID de l'utilisateur qui crée la partie
    joueurs: [],
    etat: 'en-attente', 
    // Autres informations sur la partie, comme les joueurs, le statut, etc.
  };

  // Ajoutez la nouvelle partie à la liste des parties dans les données chargées depuis le fichier db.json
  dbData.parties.push(nouvellePartie);

  // Enregistrez les modifications dans le fichier db.json
  fs.writeFileSync('db.json', JSON.stringify(dbData, null, 2));

  res.json({ message: 'Partie créée avec succès.', partie: nouvellePartie });
});

// Endpoint pour rejoindre une partie existante
app.post('/jeu/rejoindre-partie/:partieId', (req, res) => {
  const { partieId } = req.params;
  const userId = req.session.userId;

  // Chargez les données depuis le fichier db.json
  const dbData = JSON.parse(fs.readFileSync('db.json'));

  // Recherchez la partie par son ID
  const partie = dbData.parties.find((p) => p.id === partieId);

  if (!partie) {
    return res.status(404).json({ message: 'Partie non trouvée.' });
  }

  partie.etat = 'en-cours'; 
  // Vérifiez si l'utilisateur est déjà connecté à la partie
  if (partie.joueurs.includes(userId)) {
    return res.status(400).json({ message: 'Vous êtes déjà connecté à cette partie.' });
  }

  // Vérifiez si la partie est complète (par exemple, deux joueurs maximum)
  if (partie.joueurs.length >= 2) {
    return res.status(400).json({ message: 'La partie est complète.' });
  }

  // Ajoutez l'ID de l'utilisateur à la liste des joueurs de la partie
  partie.joueurs.push(userId);

  // Enregistrez les modifications dans le fichier db.json
  fs.writeFileSync('db.json', JSON.stringify(dbData, null, 2));

  res.json({ message: 'Vous avez rejoint la partie avec succès.', partie });
});

app.post('/jeu/jouer-coup', (req, res) => {
  const userId = req.session.userId;
  const { partieId, choix } = req.body; // Le choix de l'utilisateur (pierre, papier ou ciseaux) et l'ID de la partie

  // Chargez les données depuis le fichier db.json
  const dbData = JSON.parse(fs.readFileSync('db.json'));

  // Recherchez la partie en cours par son ID
  const partieEnCours = dbData.parties.find((partie) => partie.id === partieId && partie.etat === 'en_cours');

  if (!partieEnCours) {
    return res.status(400).json({ message: "Partie en cours non trouvée." });
  }

  // Vérifiez si l'utilisateur fait partie de cette partie
  if (!partieEnCours.joueurs.includes(userId)) {
    return res.status(400).json({ message: "Vous ne faites pas partie de cette partie." });
  }

  // Vérifiez si c'est le tour de l'utilisateur pour jouer
  if (partieEnCours.tourDe !== userId) {
    return res.status(400).json({ message: "Ce n'est pas votre tour de jouer." });
  }

  // Enregistrez le choix de l'utilisateur dans l'objet de partie
  partieEnCours.choixJoueur = choix;

  // Passez au tour de l'autre joueur ou mettez fin à la partie, selon votre logique
  if (partieEnCours.choixJoueur2) {
    // Les deux joueurs ont joué, vous pouvez maintenant déterminer le résultat
    const resultat = determinerResultat(partieEnCours.choixJoueur, partieEnCours.choixJoueur2);

    // Mettez à jour le résultat de la partie
    partieEnCours.resultat = resultat;

    // Vous devrez également mettre à jour l'état de la partie (en attente, en cours, terminée) en fonction de votre logique
  } else {
    // C'est maintenant le tour du deuxième joueur
    partieEnCours.tourDe = partieEnCours.joueurs.find((joueur) => joueur !== userId);
  }

  // Enregistrez les modifications dans le fichier db.json
  fs.writeFileSync('db.json', JSON.stringify(dbData, null, 2));

  res.json({ message: 'Coup joué avec succès.', partie: partieEnCours });
});

// Fonction pour déterminer le résultat en fonction des choix des joueurs
function determinerResultat(choixJoueur1, choixJoueur2) {
  if (choixJoueur1 === choixJoueur2) {
    return 'égalité';
  } else if (
    (choixJoueur1 === 'pierre' && choixJoueur2 === 'ciseaux') ||
    (choixJoueur1 === 'papier' && choixJoueur2 === 'pierre') ||
    (choixJoueur1 === 'ciseaux' && choixJoueur2 === 'papier')
  ) {
    return 'victoire';
  } else {
    return 'défaite';
  }
}



app.post('/jeu/terminer-partie/:partieId', (req, res) => {
  const { partieId } = req.params;

  const dbData = JSON.parse(fs.readFileSync('db.json'));

  const partie = dbData.parties.find((p) => p.id === partieId);

  if (!partie) {
    return res.status(404).json({ message: 'Partie non trouvée.' });
  }

  partie.etat = 'terminee'; 

  fs.writeFileSync('db.json', JSON.stringify(dbData, null, 2));

  res.json({ message: 'La partie est terminée.', partie });
});


const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Serveur en cours d'exécution sur le port ${port}`);
});
