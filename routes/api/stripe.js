var express = require('express');
var router = express.Router();

var stripeControllers = require('@/controllers/api/stripe.js');

router.post('/callback', stripeControllers.callback);

module.exports = router;