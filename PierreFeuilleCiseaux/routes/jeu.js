const express = require('express');
const router = express.Router();
const jeuController = require('../controllers/jeuController');

router.post('/creer-partie', jeuController.creerPartie);
router.post('/rejoindre-partie', jeuController.rejoindrePartie);
router.post('/jouer-tour', jeuController.jouerTour);

module.exports = router;
