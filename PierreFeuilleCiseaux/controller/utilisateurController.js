const Utilisateur = require('../models/utilisateur'); 

async function creerCompte(req, res) {
  try {
    const { nomUtilisateur, motDePasse, email } = req.body;

    const utilisateurExistant = await Utilisateur.findOne({ nomUtilisateur });
    if (utilisateurExistant) {
      return res.status(400).json({ message: 'Ce nom d\'utilisateur est déjà pris.' });
    }

    const nouvelUtilisateur = new Utilisateur({ nomUtilisateur, motDePasse, email });
    await nouvelUtilisateur.save();

    res.status(201).json({ message: 'Compte utilisateur créé avec succès' });
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ message: 'Erreur lors de la création du compte utilisateur' });
  }
}

async function seConnecter(req, res) {
}

module.exports = {
  creerCompte,
  seConnecter,
};
