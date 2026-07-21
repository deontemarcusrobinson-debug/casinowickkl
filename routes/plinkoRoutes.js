var express = require('express');
var router = express.Router();

var plinkoControllers = require('@/controllers/plinkoControllers.js');

router.get('/', plinkoControllers.plinko);

module.exports = router;