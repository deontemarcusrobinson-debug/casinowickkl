var config = require('@/config/config.js');

var { loggerWarn } = require('@/lib/logger.js');
var { usersRequests } = require('@/lib/globals.js');

var { makeDate, time } = require('@/utils/formatDate.js');
var { emitSocketToUser } = require('@/utils/socket.js');
var { haveRankPermission } = require('@/utils/utils.js');

var chatService = require('@/services/chatService.js');

var rewardsService = require('@/services/rewardsService.js');
var affiliatesService = require('@/services/affiliatesService.js');

var userService = require('@/services/userService.js');
var accountService = require('@/services/accountService.js');
var historyService = require('@/services/historyService.js');
var fairService = require('@/services/fairService.js');
var supportService = require('@/services/supportService.js');

var rainService = require('@/services/rainService.js');

var adminAffiliatesService = require('@/services/admin/affiliatesService.js');
var adminDashboardService = require('@/services/admin/dashboardService.js');
var adminGamesService = require('@/services/admin/gamesService.js');
var adminPaymentsService = require('@/services/admin/paymentsService.js');
var adminRewardsService = require('@/services/admin/rewardsService.js');
var adminSettingsService = require('@/services/admin/settingsService.js');
var adminSupportService = require('@/services/admin/supportService.js');
var adminUsersService = require('@/services/admin/usersService.js');

var rouletteService = require('@/services/games/rouletteService.js');
var crashService = require('@/services/games/crashService.js');
var jackpotService = require('@/services/games/jackpotService.js');
var coinflipService = require('@/services/games/coinflipService.js');
var diceService = require('@/services/games/diceService.js');
var minesweeperService = require('@/services/games/minesweeperService.js');
var towerService = require('@/services/games/towerService.js');
var plinkoService = require('@/services/games/plinkoService.js');
var casinoService = require('@/services/games/casinoService.js');

var cashService = require('@/services/trading/cashService.js');

var cryptoService = require('@/services/trading/cryptoService.js');
var cryptoHashDepositService = require('@/services/trading/cryptoHashDepositService.js');

function userRequest_cooldown(userid, action, value, games, data){
	if(usersRequests[userid] !== undefined && usersRequests[userid][action] !== undefined) {
        clearTimeout(usersRequests[userid][action]);
        delete usersRequests[userid][action];
    }

    if(value){
        if(action == 'dice_bet') diceService.gameCooldown[userid] = true;
        if(action == 'plinko_bet') plinkoService.gameCooldown[userid] = true;

        if(usersRequests[userid] === undefined) usersRequests[userid] = {};

        usersRequests[userid][action] = setTimeout(function(){
            clearTimeout(usersRequests[userid][action]);
            delete usersRequests[userid][action];

            if(action == 'dice_bet') diceService.gameCooldown[userid] = false;
            if(action == 'plinko_bet') plinkoService.gameCooldown[userid] = false;

            if(action == 'coinflip_join') {
                if(coinflipService.secure[data.id] !== undefined && coinflipService.secure[data.id][userid] !== undefined) delete coinflipService.secure[data.id][userid];
            }

            loggerWarn('[SERVER] Old request not finished for Userid: ' + userid + ' | Action: ' + action);
        }, 10 * 1000)
	} else {
        if(games){
            if(action == 'dice_bet') diceService.gameCooldown[userid] = false;
            if(action == 'plinko_bet') plinkoService.gameCooldown[userid] = false;
        }

        if(action == 'coinflip_join') {
			if(coinflipService.secure[data.id] !== undefined && coinflipService.secure[data.id][userid] !== undefined) delete coinflipService.secure[data.id][userid];
		}

	}
}

module.exports = (socket) => {
    return (data, callback) => {
        if(adminSettingsService.updating.value){
			return emitSocketToUser(socket, 'message', 'error', {
				message: 'The server settings are updating. Please try again later!'
			});
		}

        if(usersRequests[socket.data.user ? socket.data.user.userid : socket.id] === undefined) usersRequests[socket.data.user ? socket.data.user.userid : socket.id] = {};

		if(usersRequests[socket.data.user ? socket.data.user.userid : socket.id][[ data.type, data.command ].join('_')] !== undefined){
            if(socket.data.user) loggerWarn(socket.data.user.name + '(' + socket.data.user.userid + ') - Duplicated request: ' + JSON.stringify(data));
            else loggerWarn('Guest(' + socket.id + ') - Duplicated request: ' + JSON.stringify(data));

            return emitSocketToUser(socket, 'message', 'error', {
				message: 'Wait for ending last action!'
			});
		}

        if(socket.data.maintenance){
            return emitSocketToUser(socket, 'message', 'error', {
                message: 'The server is now in maintenance. Please try again later!'
            });
        }

        if(socket.data.user) loggerWarn(socket.data.user.name + '(' + socket.data.user.userid + ') - New request: ' + JSON.stringify(data));
        else loggerWarn('Guest(' + socket.id + ') - New request: ' + JSON.stringify(data));

        function cooldown(value, games){
            userRequest_cooldown(socket.data.user ? socket.data.user.userid : socket.id, [ data.type, data.command ].join('_'), value, games, data);
        }

        //ACCOUNT REQUESTS
        if(data.type == 'account') {
            if(!socket.data.user) {
                return emitSocketToUser(socket, 'message', 'error', {
                    message: 'Session expired or you are not logged in. Please refresh the page and try again.'
                });
            }

            if(!socket.data.user.authorized.account && [ 'save_email', 'remove_session', 'remove_sessions', 'enable_email_verification', 'activate_email_verification', 'disable_email_verification', 'enable_authenticator_app', 'activate_authenticator_app', 'disable_authenticator_app', 'manage_authenticator_app', 'generate_codes_authenticator_app', 'twofa_primary_method' ].includes(data.command)) {
                return emitSocketToUser(socket, 'message', 'error', {
                    message: 'Your identity verification session expired. Please refresh the page!'
                });
            }

            /* REQUESTS FOR USERS */

            if(data.command == 'save_email') return accountService.saveEmail(socket.data.user, socket, data.email, data.recaptcha, cooldown);

            if(data.command == 'tip') return accountService.sendTip(socket.data.user, socket, data.userid, data.amount, data.recaptcha, cooldown);
            if(data.command == 'mute') return accountService.mutePlayer(socket.data.user, socket, data.userid, data.reason, data.expire, cooldown);

            if(data.command == 'deposit_bonus') return accountService.applyDepositBonus(socket.data.user, socket, data.code, data.recaptcha, cooldown);
            if(data.command == 'bonus_code') return accountService.applyBonusCode(socket.data.user, socket, data.code, data.recaptcha, cooldown);
            if(data.command == 'profile_settings') return accountService.saveProfileSettings(socket.data.user, socket, data.data, cooldown);
            if(data.command == 'self_exclusion_day') return accountService.setSelfExclusionDay(socket.data.user, socket, data.recaptcha, cooldown);
            if(data.command == 'self_exclusion_week') return accountService.setSelfExclusionWeek(socket.data.user, socket, data.recaptcha, cooldown);
            if(data.command == 'self_exclusion_month') return accountService.setSelfExclusionMonth(socket.data.user, socket, data.recaptcha, cooldown);
            if(data.command == 'remove_session') return accountService.removeSessionAccount(socket.data.user, socket, data.session, cooldown);
            if(data.command == 'remove_sessions') return accountService.removeAllSessionsAccount(socket.data.user, socket, cooldown);

            if(data.command == 'enable_email_verification') return accountService.enableEmailVerification(socket.data.user, socket, cooldown);
            if(data.command == 'activate_email_verification') return accountService.activateEmailVerification(socket.data.user, socket, data.code, cooldown);
            if(data.command == 'disable_email_verification') return accountService.disableEmailVerification(socket.data.user, socket, cooldown);

            if(data.command == 'enable_authenticator_app') return accountService.enableAuthenticatorApp(socket.data.user, socket, cooldown);
            if(data.command == 'activate_authenticator_app') return accountService.activateAuthenticatorApp(socket.data.user, socket, data.token, cooldown);
            if(data.command == 'disable_authenticator_app') return accountService.disableAuthenticatorApp(socket.data.user, socket, cooldown);
            if(data.command == 'manage_authenticator_app') return accountService.manageAuthenticatorApp(socket.data.user, socket, cooldown);
            if(data.command == 'generate_codes_authenticator_app') return accountService.generateCodesAuthenticatorApp(socket.data.user, socket, cooldown);

            if(data.command == 'twofa_primary_method') return accountService.setTwofaPrimaryMethod(socket.data.user, socket, data.method, cooldown);

            /* END REQUESTS FOR USERS */
        }

        //REWARDS REQUESTS
        if(data.type == 'rewards'){
            if(!socket.data.user) {
                return emitSocketToUser(socket, 'message', 'error', {
                    message: 'Session expired or you are not logged in. Please refresh the page and try again.'
                });
            }

            /* REQUESTS FOR USERS */

            if(socket.data.user.exclusion > time()) {
                return emitSocketToUser(socket, 'message', 'error', {
                    message: 'Your exclusion expires ' + makeDate(new Date(socket.data.user.exclusion * 1000)) + '.'
                });
            }

            if(data.command == 'redeem_referral') return rewardsService.redeemReferralCode(socket.data.user, socket, data.code, data.recaptcha, cooldown);
            if(data.command == 'claim_task') return rewardsService.claimTask(socket.data.user, socket, data.task, data.recaptcha, cooldown);

            /* END REQUESTS FOR USERS */
        }

        //AFFILIATES REQUESTS
        if(data.type == 'affiliates') {
            /* REQUESTS FOR GUESTS */

            if(data.command == 'overview') return affiliatesService.getOverview(socket.data.user, socket, data.date, cooldown);

            /* END REQUESTS FOR GUESTS */

            if(!socket.data.user) {
                return emitSocketToUser(socket, 'message', 'error', {
                    message: 'Session expired or you are not logged in. Please refresh the page and try again.'
                });
            }

            /* REQUESTS FOR USERS */

            if(data.command == 'claim_earnings') return affiliatesService.claimEarnings(socket.data.user, socket, data.recaptcha, cooldown);
            if(data.command == 'create_referral') return affiliatesService.createReferralCode(socket.data.user, socket, data.code, data.recaptcha, cooldown);

            /* END REQUESTS FOR USERS */
        }

        //HISTORY REQUESTS
        if(data.type == 'history') {
            /* REQUESTS FOR GUESTS */

            if(data.command == 'get') return historyService.getHistory(socket.data.user, socket, data.history, cooldown);

            /* END REQUESTS FOR GUESTS */

            if(!socket.data.user) {
                return emitSocketToUser(socket, 'message', 'error', {
                    message: 'Session expired or you are not logged in. Please refresh the page and try again.'
                });
            }
        }

        //CHAT REQUESTS
        if(data.type == 'chat') {
            /* REQUESTS FOR GUESTS */

            if(data.command == 'channel') return chatService.loadChannel(socket.data.user, socket, data.channel, cooldown);
            if(data.command == 'commands') return chatService.loadCommands(socket.data.user, socket, data.message, cooldown);

            /* END REQUESTS FOR GUESTS */

            if(!socket.data.user) {
                return emitSocketToUser(socket, 'message', 'error', {
                    message: 'Session expired or you are not logged in. Please refresh the page and try again.'
                });
            }

            /* REQUESTS FOR USERS */

            if(data.command == 'message') return chatService.checkMessage(socket.data.user, socket, data.message, data.channel, data.reply, cooldown);

            /* END REQUESTS FOR USERS */
        }

        //RAIN REQUESTS
        if(data.type == 'rain') {
            if(!socket.data.user) {
                return emitSocketToUser(socket, 'message', 'error', {
                    message: 'Session expired or you are not logged in. Please refresh the page and try again.'
                });
            }

            /* REQUESTS FOR USERS */

            if(data.command == 'join') return rainService.joinGame(socket.data.user, socket, data.recaptcha, cooldown);
            if(data.command == 'tip') return rainService.tipGame(socket.data.user, socket, data.amount, cooldown);

            /* END REQUESTS FOR USERS */
        }

        //FAIR REQUESTS
        if(data.type == 'fair') {
            if(!socket.data.user) {
                return emitSocketToUser(socket, 'message', 'error', {
                    message: 'Session expired or you are not logged in. Please refresh the page and try again.'
                });
            }

            /* REQUESTS FOR USERS */

            if(data.command == 'save_clientseed') return fairService.changeClientSeed(socket.data.user, socket, data.seed, data.recaptcha, cooldown);
            if(data.command == 'regenerate_serverseed') return fairService.regenerateServerSeed(socket.data.user, socket, data.recaptcha, cooldown);

            /* END REQUESTS FOR USERS */
        }

        //SUPPORT REQUESTS
        if(data.type == 'support') {
            if(!socket.data.user) {
                return emitSocketToUser(socket, 'message', 'error', {
                    message: 'Session expired or you are not logged in. Please refresh the page and try again.'
                });
            }

            /* REQUESTS FOR USERS */

            if(data.command == 'create') return supportService.createRequest(socket.data.user, socket, data.subject, data.department, data.message, cooldown);
            if(data.command == 'reply') return supportService.replyRequest(socket.data.user, socket, data.id, data.message, cooldown);
            if(data.command == 'close') return supportService.closeRequest(socket.data.user, socket, data.id, cooldown);

            /* END REQUESTS FOR USERS */
        }

        //GAME BOTS REQUESTS
        if(data.type == 'gamebots') {
            if(!socket.data.user) {
                return emitSocketToUser(socket, 'message', 'error', {
                    message: 'Session expired or you are not logged in. Please refresh the page and try again.'
                });
            }

            /* REQUESTS FOR USERS */

            if(data.command == 'confirm') return adminGamesService.confirmGameBot(socket.data.user, socket, data.userid, data.game, data.data, cooldown);

            /* END REQUESTS FOR USERS */
        }

        //ADMIN REQUESTS
        if(data.type == 'admin') {

            if(!socket.data.user) {
                return emitSocketToUser(socket, 'message', 'error', {
                    message: 'Session expired or you are not logged in. Please refresh the page and try again.'
                });
            }

            if(!socket.data.user.authorized.admin) {
                return emitSocketToUser(socket, 'message', 'error', {
                    message: 'Your identity verification session expired. Please refresh the page!'
                });
            }

            /* REQUESTS FOR USERS */

            if(data.command == 'dashboard_graph') return adminDashboardService.getGraph(socket.data.user, socket, data.graph, cooldown);
            if(data.command == 'dashboard_graphs') return adminDashboardService.getAllGraphs(socket.data.user, socket, data.graphs, cooldown);
            if(data.command == 'dashboard_stats') return adminDashboardService.getAllStats(socket.data.user, socket, data.stats, cooldown);

            if(data.command == 'users_remove_link') return adminUsersService.removeUserLink(socket.data.user, socket, data.userid, data.provider, data.secret, cooldown);
            if(data.command == 'users_remove_exclusion') return adminUsersService.removeUserExclusion(socket.data.user, socket, data.userid, data.secret, cooldown);
            if(data.command == 'users_remove_sessions') return adminUsersService.removeUserSessions(socket.data.user, socket, data.userid, data.secret, cooldown);
            if(data.command == 'users_ban_ip') return adminUsersService.banUserIp(socket.data.user, socket, data.userid, data.ip, data.secret, cooldown);
            if(data.command == 'users_unban_ip') return adminUsersService.unbanUserIp(socket.data.user, socket, data.userid, data.ip, data.secret, cooldown);
            if(data.command == 'users_set_rank') return adminUsersService.setUserRank(socket.data.user, socket, data.userid, data.rank, data.secret, cooldown);
            if(data.command == 'users_edit_balance') return adminUsersService.editUserBalance(socket.data.user, socket, data.userid, data.amount, data.secret, cooldown);
            if(data.command == 'users_set_restriction') return adminUsersService.setUserRestriction(socket.data.user, socket, data.userid, data.restriction, data.reason, data.expire, data.secret, cooldown);
            if(data.command == 'users_unset_restriction') return adminUsersService.unsetUserRestriction(socket.data.user, socket, data.userid, data.restriction, data.secret, cooldown);

            if(data.command == 'payments_confirm_listing') return adminPaymentsService.confirmWithdrawListing(socket.data.user, socket, data.method, data.trade, data.secret, cooldown);
            if(data.command == 'payments_cancel_listing') return adminPaymentsService.cancelWithdrawListing(socket.data.user, socket, data.method, data.trade, data.secret, cooldown);
            if(data.command == 'payments_manually_amount') return adminPaymentsService.setManuallyWithdrawAmount(socket.data.user, socket, data.amount, data.secret, cooldown);
            if(data.command == 'payments_create_deposit_bonus') return adminPaymentsService.createDepositBonus(socket.data.user, socket, data.referral, data.code, data.secret, cooldown);
            if(data.command == 'payments_remove_deposit_bonus') return adminPaymentsService.removeDepositBonus(socket.data.user, socket, data.id, data.secret, cooldown);
            if(data.command == 'payments_create_manual_deposit') return adminPaymentsService.createManualDeposit(socket.data.user, socket, data.userid, data.amount, data.secret, cooldown);
            if(data.command == 'payments_create_manual_withdrawal') return adminPaymentsService.createManualWithdrawal(socket.data.user, socket, data.userid, data.amount, data.secret, cooldown);
            if(data.command == 'payments_approve_hash_deposit') return cryptoHashDepositService.approveHashDeposit(socket.data.user, socket, data.id, data.secret, cooldown);
            if(data.command == 'payments_reject_hash_deposit') return cryptoHashDepositService.rejectHashDeposit(socket.data.user, socket, data.id, data.secret, cooldown);

            if(data.command == 'games_set_house_edges') return adminGamesService.setGamesHouseEdges(socket.data.user, socket, data.house_edges, data.secret, cooldown);
            if(data.command == 'games_create_gamebot') return adminGamesService.createGameBot(socket.data.user, socket, data.name, data.secret, cooldown);

            if(data.command == 'rewards_create_bonus_code') return adminRewardsService.createBonusCode(socket.data.user, socket, data.code, data.amount, data.uses, data.expire, data.secret, cooldown);
            if(data.command == 'rewards_remove_bonus_code') return adminRewardsService.removeBonusCode(socket.data.user, socket, data.id, data.secret, cooldown);

            if(data.command == 'support_claim_request') return adminSupportService.claimRequest(socket.data.user, socket, data.id, data.secret, cooldown);
            if(data.command == 'support_release_request') return adminSupportService.releaseRequest(socket.data.user, socket, data.id, data.secret, cooldown);
            if(data.command == 'support_change_request_department') return adminSupportService.changeRequestDepartment(socket.data.user, socket, data.id, data.department, data.secret, cooldown);
            if(data.command == 'support_reply_request') return adminSupportService.replyRequest(socket.data.user, socket, data.id, data.message, data.secret, cooldown);
            if(data.command == 'support_close_request') return adminSupportService.closeRequest(socket.data.user, socket, data.id, data.secret, cooldown);

            if(data.command == 'settings_set_maintenance') return adminSettingsService.setMaintenance(socket.data.user, socket, data.status, data.reason, data.secret, cooldown);
            if(data.command == 'settings_set_settings') return adminSettingsService.setSettings(socket.data.user, socket, data.settings, data.status, data.secret, cooldown);
            if(data.command == 'settings_create_tracking_link') return adminSettingsService.createTrackingLink(socket.data.user, socket, data.name, data.expire, data.secret, cooldown);
            if(data.command == 'settings_remove_tracking_link') return adminSettingsService.removeTrackingLink(socket.data.user, socket, data.id, data.secret, cooldown);
            if(data.command == 'settings_set_admin_access') return adminSettingsService.setAdminAccess(socket.data.user, socket, data.userid, data.secret, cooldown);
            if(data.command == 'settings_unset_admin_access') return adminSettingsService.unsetAdminAccess(socket.data.user, socket, data.userid, data.secret, cooldown);

            /* END REQUESTS FOR USERS */
        }

        //PAGINATION REQUESTS
        if(data.type == 'pagination') {

            /* REQUESTS FOR GUESTS */

            if(data.command == 'affiliates_referred_users') return affiliatesService.getReferredUsers(socket.data.user, socket, data.page, data.order, data.search, cooldown);

            if(data.command == 'casino_slots_games') return casinoService.getSlotsGames(socket.data.user, socket, data.page, data.order, data.provider, data.search, cooldown);
            if(data.command == 'casino_live_games') return casinoService.getLiveGames(socket.data.user, socket, data.page, data.order, data.provider, data.search, cooldown);
            if(data.command == 'casino_recent_games') return casinoService.getRecentGames(socket.data.user, socket, data.page, data.order, data.provider, data.search, cooldown);
            if(data.command == 'casino_favorites_games') return casinoService.getFavoritesGames(socket.data.user, socket, data.page, data.order, data.provider, data.search, cooldown);
            if(data.command == 'casino_all_games') return casinoService.getAllGames(socket.data.user, socket, data.page, data.search, cooldown);

            if(data.command == 'casino_providers') return casinoService.getProviders(socket.data.user, socket, data.page, data.order, data.search, cooldown);
            if(data.command == 'casino_providers_provider_games') return casinoService.getProvidersProviderGames(socket.data.user, socket, data.page, data.id, data.order, data.search, cooldown);

            /* END REQUESTS FOR GUESTS */

            if(!socket.data.user) {
                return emitSocketToUser(socket, 'message', 'error', {
                    message: 'Session expired or you are not logged in. Please refresh the page and try again.'
                });
            }

            if(!socket.data.user.authorized.admin && [
                'admin_users',
                'admin_crypto_confirmations',
                'admin_crypto_hash_deposits',
                'admin_deposit_bonuses',
                'admin_gamebots',
                'admin_bonus_codes',
                'admin_referrals',
                'admin_referred_users',
                'admin_support_requests',
                'admin_tracking_links'
            ].includes(data.command)) {
                return emitSocketToUser(socket, 'message', 'error', {
                    message: 'Your identity verification session expired. Please refresh the page!'
                });
            }

            /* REQUESTS FOR USERS */

            if(data.command == 'admin_users') return adminUsersService.getUsers(socket.data.user, socket, data.page, data.order, data.search, cooldown);

            if(data.command == 'admin_crypto_confirmations') return adminPaymentsService.getCryptoWithdrawListings(socket.data.user, socket, data.page, cooldown);
            if(data.command == 'admin_crypto_hash_deposits') return cryptoHashDepositService.getPendingHashDeposits(socket.data.user, socket, data.page, cooldown);
            if(data.command == 'admin_deposit_bonuses') return adminPaymentsService.getDepositBonuses(socket.data.user, socket, data.page, data.search, cooldown);

            if(data.command == 'admin_gamebots') return adminGamesService.getGameBots(socket.data.user, socket, data.page, data.order, data.search, cooldown);

            if(data.command == 'admin_bonus_codes') return adminRewardsService.getBonusCodes(socket.data.user, socket, data.page, data.status, data.search, cooldown);

            if(data.command == 'admin_referrals') return adminAffiliatesService.getReferrals(socket.data.user, socket, data.page, data.order, data.search, cooldown);
            if(data.command == 'admin_referred_users') return adminAffiliatesService.getReferredUsers(socket.data.user, socket, data.page, data.userid, data.order, data.search, cooldown);

            if(data.command == 'admin_support_requests') return adminSupportService.getRequests(socket.data.user, socket, data.page, data.status, data.department, data.search, cooldown);

            if(data.command == 'admin_tracking_links') return adminSettingsService.getTrackingLinks(socket.data.user, socket, data.page, data.search, cooldown);

            if(data.command == 'account_transactions') return accountService.getAccountTransactions(socket.data.user, socket, data.page, cooldown);
            if(data.command == 'account_deposits') return accountService.getAccountDeposits(socket.data.user, socket, data.page, cooldown);
            if(data.command == 'account_withdrawals') return accountService.getAccountWithdrawals(socket.data.user, socket, data.page, cooldown);
            if(data.command == 'account_roulette_history') return accountService.getAccountRouletteHistory(socket.data.user, socket, data.page, cooldown);
            if(data.command == 'account_crash_history') return accountService.getAccountCrashHistory(socket.data.user, socket, data.page, cooldown);
            if(data.command == 'account_jackpot_history') return accountService.getAccountJackpotHistory(socket.data.user, socket, data.page, cooldown);
            if(data.command == 'account_coinflip_history') return accountService.getAccountCoinflipHistory(socket.data.user, socket, data.page, cooldown);
            if(data.command == 'account_dice_history') return accountService.getAccountDiceHistory(socket.data.user, socket, data.page, cooldown);
            if(data.command == 'account_tower_history') return accountService.getAccountTowerHistory(socket.data.user, socket, data.page, cooldown);
            if(data.command == 'account_minesweeper_history') return accountService.getAccountMinesweeperHistory(socket.data.user, socket, data.page, cooldown);
            if(data.command == 'account_plinko_history') return accountService.getAccountPlinkoHistory(socket.data.user, socket, data.page, cooldown);
            if(data.command == 'account_casino_history') return accountService.getAccountCasinoHistory(socket.data.user, socket, data.page, cooldown);

            if(data.command == 'user_transactions') return userService.getUserTransactions(socket.data.user, socket, data.page, data.userid, cooldown);
            if(data.command == 'user_deposits') return userService.getUserDeposits(socket.data.user, socket, data.page, data.userid, cooldown);
            if(data.command == 'user_withdrawals') return userService.getUserWithdrawals(socket.data.user, socket, data.page, data.userid, cooldown);
            if(data.command == 'user_roulette_history') return userService.getUserRouletteHistory(socket.data.user, socket, data.page, data.userid, cooldown);
            if(data.command == 'user_crash_history') return userService.getUserCrashHistory(socket.data.user, socket, data.page, data.userid, cooldown);
            if(data.command == 'user_jackpot_history') return userService.getUserJackpotHistory(socket.data.user, socket, data.page, data.userid, cooldown);
            if(data.command == 'user_coinflip_history') return userService.getUserCoinflipHistory(socket.data.user, socket, data.page, data.userid, cooldown);
            if(data.command == 'user_dice_history') return userService.getUserDiceHistory(socket.data.user, socket, data.page, data.userid, cooldown);
            if(data.command == 'user_tower_history') return userService.getUserTowerHistory(socket.data.user, socket, data.page, data.userid, cooldown);
            if(data.command == 'user_minesweeper_history') return userService.getUserMinesweeperHistory(socket.data.user, socket, data.page, data.userid, cooldown);
            if(data.command == 'user_plinko_history') return userService.getUserPlinkoHistory(socket.data.user, socket, data.page, data.userid, cooldown);
            if(data.command == 'user_casino_history') return userService.getUserCasinoHistory(socket.data.user, socket, data.page, data.userid, cooldown);

            if(data.command == 'support_requests') return supportService.getSupportRequests(socket.data.user, socket, data.page, data.status, data.search, cooldown);

            /* END REQUESTS FOR USERS */
        }

        //ORIGINAL GAMES REQUESTS
        if(config.settings.games.games.original[data.type] !== undefined){
            if(!config.settings.games.games.original[data.type].enable && !haveRankPermission('play_disabled', socket.data.user.rank)){
                return emitSocketToUser(socket, 'message', 'error', {
                    message: 'This game is offline. Please try again later!'
                });
            }

            /* REQUESTS FOR GUESTS */

            if(data.type == 'roulette') {
                if(data.command == 'jackpot_history') return rouletteService.getJackpotHistory(socket.data.user, socket, cooldown);
                if(data.command == 'jackpot_winners') return rouletteService.getJackpotWinners(socket.data.user, socket, data.id, cooldown);
            }

            /* END REQUESTS FOR GUESTS */

            if(!socket.data.user) {
                emitSocketToUser(socket, 'message', 'error', {
                    message: 'Session expired or you are not logged in. Please refresh the page and try again.'
                });

                return emitSocketToUser(socket, 'modal', 'auth');
            }

            /* REQUESTS FOR USERS */

            if(!config.settings.games.status && !haveRankPermission('play_offline', socket.data.user.rank)){
                return emitSocketToUser(socket, 'message', 'error', {
                    message: 'The server bets is now offline. Please try again later!'
                });
            }

            if((socket.data.user.restrictions.play >= time() || socket.data.user.restrictions.play == -1) && !haveRankPermission('exclude_ban_play', socket.data.user.rank)){
                return emitSocketToUser(socket, 'message', 'error', {
                    message: 'You are restricted to use our games. The restriction expires ' + ((socket.data.user.restrictions.play == -1) ? 'never' : makeDate(new Date(socket.data.user.restrictions.play * 1000))) + '.'
                });
            }

            if(socket.data.user.exclusion > time()) {
                return emitSocketToUser(socket, 'message', 'error', {
                    message: 'Your exclusion expires ' + makeDate(new Date(socket.data.user.exclusion * 1000)) + '.'
                });
            }

            if(data.type == 'roulette') {
                if(data.command == 'bet') return rouletteService.placeBet(socket.data.user, socket, data.amount, data.color, cooldown);
            }

            if(data.type == 'crash') {
                if(data.command == 'bet') return crashService.placeBet(socket.data.user, socket, data.amount, data.auto, cooldown);
                if(data.command == 'cashout') return crashService.cashoutBet(socket.data.user, socket, cooldown);
            }

            if(data.type == 'jackpot') {
                if(data.command == 'bet') return jackpotService.placeBet(socket.data.user, socket, data.amount, cooldown);
            }

            if(data.type == 'coinflip') {
                if(data.command == 'create') return coinflipService.createGame(socket.data.user, socket, data.amount, data.position, cooldown);
                if(data.command == 'join') return coinflipService.joinGame(socket.data.user, socket, data.id, cooldown);
            }

            if(data.type == 'dice') {
                if(data.command == 'bet') return diceService.placeBet(socket.data.user, socket, data.amount, data.chance, data.mode, cooldown);
            }

            if(data.type == 'minesweeper') {
                if(data.command == 'bet') return minesweeperService.placeBet(socket.data.user, socket, data.amount, data.bombs, cooldown);
                if(data.command == 'cashout') return minesweeperService.cashoutBet(socket.data.user, socket, cooldown);
                if(data.command == 'bomb') return minesweeperService.checkBomb(socket.data.user, socket, data.bomb, cooldown);
            }

            if(data.type == 'tower') {
                if(data.command == 'bet') return towerService.placeBet(socket.data.user, socket, data.amount, data.difficulty, cooldown);
                if(data.command == 'cashout') return towerService.cashoutBet(socket.data.user, socket, cooldown);
                if(data.command == 'stage') return towerService.checkStage(socket.data.user, socket, data.stage, data.button, cooldown);
            }

            if(data.type == 'plinko') {
                if(data.command == 'bet') return plinkoService.placeBet(socket.data.user, socket, data.amount, data.difficulty, data.rows, cooldown);
            }

            /* END REQUESTS FOR USERS */
        }

        //CLASSIC GAMES REQUESTS
        if(config.settings.games.games.classic[data.type] !== undefined){
            if(!config.settings.games.games.classic[data.type].enable && !haveRankPermission('play_disabled', socket.data.user.rank)){
                return emitSocketToUser(socket, 'message', 'error', {
                    message: 'This game is offline. Please try again later!'
                });
            }

            /* REQUESTS FOR GUESTS */

            if(data.type == 'casino') {
                if(data.command == 'launch_demo') return casinoService.getLaunchGameDemo(socket.data.user, socket, data.id, data.device, cooldown);
            }

            /* END REQUESTS FOR GUESTS */

            if(!socket.data.user) {
                emitSocketToUser(socket, 'message', 'error', {
                    message: 'Session expired or you are not logged in. Please refresh the page and try again.'
                });

                return emitSocketToUser(socket, 'modal', 'auth');
            }

            /* REQUESTS FOR USERS */

            if(!config.settings.games.status && !haveRankPermission('play_offline', socket.data.user.rank)){
                return emitSocketToUser(socket, 'message', 'error', {
                    message: 'The server bets is now offline. Please try again later!'
                });
            }

            if((socket.data.user.restrictions.play >= time() || socket.data.user.restrictions.play == -1) && !haveRankPermission('exclude_ban_play', socket.data.user.rank)){
                return emitSocketToUser(socket, 'message', 'error', {
                    message: 'You are restricted to use our games. The restriction expires ' + ((socket.data.user.restrictions.play == -1) ? 'never' : makeDate(new Date(socket.data.user.restrictions.play * 1000))) + '.'
                });
            }

            if(socket.data.user.exclusion > time()) {
                return emitSocketToUser(socket, 'message', 'error', {
                    message: 'Your exclusion expires ' + makeDate(new Date(socket.data.user.exclusion * 1000)) + '.'
                });
            }

            if(data.type == 'casino') {
                if(data.command == 'set_favorite') return casinoService.setFavoriteGame(socket.data.user, socket, data.id, cooldown);
                if(data.command == 'unset_favorite') return casinoService.unsetFavoriteGame(socket.data.user, socket, data.id, cooldown);

                if(data.command == 'launch_real') return casinoService.getLaunchGameReal(socket.data.user, socket, data.id, data.device, cooldown);
            }

            /* END REQUESTS FOR USERS */
        }

        if(data.type == 'cash') {
            if(config.settings.payments.methods.cash[data.method] === undefined || (!config.settings.payments.methods.cash[data.method].enable.deposit && !haveRankPermission('trade_disabled', socket.data.user.rank))){
                return emitSocketToUser(socket, 'message', 'error', {
                    message: 'This Cash deposit method is offline. Please try again later!'
                });
            }

            if(!socket.data.user) {
                emitSocketToUser(socket, 'message', 'error', {
                    message: 'Session expired or you are not logged in. Please refresh the page and try again.'
                });

                return emitSocketToUser(socket, 'modal', 'auth');
            }

            if(!config.settings.payments.status && !haveRankPermission('trade_offline', socket.data.user.rank)){
                return emitSocketToUser(socket, 'message', 'error', {
                    message: 'The server trades is now offline. Try again later!'
                });
            }

            /* REQUESTS FOR USERS */

            if(data.command == 'deposit') return cashService.placeDeposit(socket.data.user, socket, data.method, data.amount, cooldown);

            /* END REQUESTS FOR USERS */
        }

        //CRYPTO PAYMENTS REQUESTS
        if(data.type == 'crypto') {
            var deposit_requests = [ 'deposit', 'hash_deposit' ];
            var withdraw_requests = [ 'withdraw' ];

            if(data.command == 'hash_deposit') {
                // hash deposits use configured wallets; skip per-method enable for NOWPayments currencies
            } else if(deposit_requests.includes(data.command) && (config.settings.payments.methods.crypto[data.currency] === undefined || (!config.settings.payments.methods.crypto[data.currency].enable.deposit && !haveRankPermission('trade_disabled', socket.data.user.rank)))){
                return emitSocketToUser(socket, 'message', 'error', {
                    message: 'This Crypto deposit method is offline. Please try again later!'
                });
            }

            if(withdraw_requests.includes(data.command) && (config.settings.payments.methods.crypto[data.currency] === undefined || (!config.settings.payments.methods.crypto[data.currency].enable.withdraw && !haveRankPermission('trade_disabled', socket.data.user.rank)))){
                return emitSocketToUser(socket, 'message', 'error', {
                    message: 'This Crypto withdraw method is offline. Please try again later!'
                });
            }

            if(!socket.data.user) {
                emitSocketToUser(socket, 'message', 'error', {
                    message: 'Session expired or you are not logged in. Please refresh the page and try again.'
                });

                return emitSocketToUser(socket, 'modal', 'auth');
            }

            if(!config.settings.payments.status && !haveRankPermission('trade_offline', socket.data.user.rank)){
                return emitSocketToUser(socket, 'message', 'error', {
                    message: 'The server trades is now offline. Try again later!'
                });
            }

            if(data.command != 'hash_deposit' && cryptoService.updating.value){
                return emitSocketToUser(socket, 'message', 'error', {
                    message: 'The crypto currencies prices are updating. Please try again later!'
                });
            }

            /* REQUESTS FOR USERS */

            if(data.command == 'deposit') return cryptoService.placeDeposit(socket.data.user, socket, data.currency, data.value, cooldown);
            if(data.command == 'withdraw') return cryptoService.placeWithdraw(socket.data.user, socket, data.currency, data.amount, data.address, data.recaptcha, cooldown);
            if(data.command == 'hash_deposit') return cryptoHashDepositService.submitHashDeposit(socket.data.user, socket, data.currency, data.tx_hash, cooldown);

            /* END REQUESTS FOR USERS */
        }

        emitSocketToUser(socket, 'message', 'error', {
            message: 'This is a invalid request! Please refresh the page.'
        });
    };
};