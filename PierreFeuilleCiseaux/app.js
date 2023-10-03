const express = require('express');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();

// Middleware pour parser les requêtes JSON
app.use(bodyParser.json());

// Configuration d'express-session avec session-file-store
app.use(session({
  secret: 'votre_secret_session', // Clé secrète pour les sessions
  resave: false,
  saveUninitialized: true,
  store: new FileStore({
    path: './sessions', // Répertoire où les sessions seront stockées (créez ce dossier)
  }),
}));

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Serveur en cours d'exécution sur le port ${port}`);
});
