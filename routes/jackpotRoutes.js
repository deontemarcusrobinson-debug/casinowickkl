var express = require('express');
var router = express.Router();

var jackpotControllers = require('@/controllers/jackpotControllers.js');

router.get('/', jackpotControllers.jackpot);

module.exports = router;