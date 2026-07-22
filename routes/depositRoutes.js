var express = require('express');
var router = express.Router();

var depositControllers = require('@/controllers/depositControllers.js');

router.get('/', depositControllers.deposit);
router.post('/paypal/create-order', depositControllers.depositPaypalCreateOrder);
router.post('/paypal/capture', depositControllers.depositPaypalCapture);
router.get('/paid', depositControllers.depositPaypalPaid);
router.get('/paypal/return', depositControllers.depositPaypalReturn);
router.get('/paypal/cancel', depositControllers.depositPaypalCancel);
router.get('/cash/:method', depositControllers.depositCash);
router.get('/crypto/:method', depositControllers.depositCrypto);
router.get('/crypto-hash', depositControllers.depositCryptoHash);

module.exports = router;
