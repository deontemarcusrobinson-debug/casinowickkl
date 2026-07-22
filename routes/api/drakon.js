var express = require('express');
var router = express.Router();

var drakonControllers = require('@/controllers/api/drakon.js');

// Drakon "Site Endpoint" is often https://yoursite.com/drakon (posts here)
router.post('/', drakonControllers.webhook);
router.post('/drakon_api', drakonControllers.webhook);

module.exports = router;