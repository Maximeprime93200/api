const express = require('express');
const router = express.Router();
const utilisateurController = require('../controllers/utilisateurController');

router.post('/creer-compte', utilisateurController.creerCompte);
router.post('/se-connecter', utilisateurController.seConnecter);

module.exports = router;
