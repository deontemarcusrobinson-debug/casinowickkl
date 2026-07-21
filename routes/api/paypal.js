var express = require('express');
var router = express.Router();

var paypalControllers = require('@/controllers/api/paypal.js');

router.post('/webhook', paypalControllers.webhook);

module.exports = router;
