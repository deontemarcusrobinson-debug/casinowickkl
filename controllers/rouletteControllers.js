var { haveRankPermission } = require('@/utils/utils.js');
var config = require('@/config/config.js');

exports.roulette = async (req, res, next) => {
    if(!config.settings.games.games.original.roulette.enable && !haveRankPermission('play_disabled', res.locals.user ? res.locals.user.rank : 0)) return next();

    res.render('roulette', {
        page: 'roulette',
        name: config.app.pages['roulette']
    });
};