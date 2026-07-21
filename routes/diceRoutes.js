var express = require('express');
var router = express.Router();

var diceControllers = require('@/controllers/diceControllers.js');

router.get('/', diceControllers.dice);

module.exports = router;