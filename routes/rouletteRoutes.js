var express = require('express');
var router = express.Router();

var rouletteControllers = require('@/controllers/rouletteControllers.js');

router.get('/', rouletteControllers.roulette);

module.exports = router;