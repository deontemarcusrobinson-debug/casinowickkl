var express = require('express');
var router = express.Router();

var casinoControllers = require('@/controllers/casinoControllers.js');

router.get('/', casinoControllers.casinoUnset);
router.get('/lobby', casinoControllers.casinoLobby);
router.get('/slots', casinoControllers.casinoSlots);
router.get('/live', casinoControllers.casinoLive);
router.get('/recent', casinoControllers.casinoRecent);
router.get('/favorites', casinoControllers.casinoFavorites);
router.get('/providers', casinoControllers.casinoProviders);

router.get('/slots/:id', casinoControllers.casinoGame);
router.get('/providers/:id', casinoControllers.casinoProvider);

module.exports = router;