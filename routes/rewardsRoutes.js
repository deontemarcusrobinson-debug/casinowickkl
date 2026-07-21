var express = require('express');
var router = express.Router();

var rewardsControllers = require('@/controllers/rewardsControllers.js');

router.get('/', rewardsControllers.rewardsUnset);
router.get('/tasks', rewardsControllers.rewardsTasks);

module.exports = router;