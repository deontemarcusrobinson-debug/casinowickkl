var { haveRankPermission } = require('@/utils/utils.js');

var config = require('@/config/config.js');

exports.dice = async (req, res, next) => {
    if(!config.settings.games.games.original.dice.enable && !haveRankPermission('play_disabled', res.locals.user ? res.locals.user.rank : 0)) return next();

    res.render('dice', {
        page: 'dice',
        name: config.app.pages['dice']
    });
};