const express = require('express');
const passport = require('passport');
const router = express.Router();
const uuid = require('uuid'); 

// Pour accepter des demandes JSON
router.use(express.json());

router.post('/connexion',
  passport.authenticate('local', {
    successRedirect: '/jeu',
    failureRedirect: '/connexion',
  })
);

router.post('/inscription', (req, res) => {
  const { username, password } = req.body;
  const userId = uuid.v4(); 

  // Au lieu de rediriger, renvoyez une réponse JSON
  res.json({ userId });
});

module.exports = router;
