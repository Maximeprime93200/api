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
    joueurs: []
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


const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Serveur en cours d'exécution sur le port ${port}`);
});
