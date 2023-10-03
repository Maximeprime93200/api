const express = require('express');
const mongoose = require('mongoose');
const app = express();

mongoose.connect('mongodb://localhost/votre-base-de-donnees', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Erreur de connexion à la base de données :'));
db.once('open', () => {
  console.log('Connecté à la base de données');
});

app.use(express.json());

const jeuRoutes = require('./routes/jeu');
const utilisateurRoutes = require('./routes/utilisateur');

app.use('/jeu', jeuRoutes);
app.use('/utilisateur', utilisateurRoutes);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Serveur en écoute sur le port ${port}`);
});
