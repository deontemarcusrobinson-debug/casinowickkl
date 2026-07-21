var express = require('express');
var router = express.Router();

var adminControllers = require('@/controllers/admin/adminControllers.js');
var adminDashboardControllers = require('@/controllers/admin/dashboardControllers.js');
var adminUsersControllers = require('@/controllers/admin/usersControllers.js');
var adminPaymentsControllers = require('@/controllers/admin/paymentsControllers.js');
var adminGamesControllers = require('@/controllers/admin/gamesControllers.js');
var adminRewardsControllers = require('@/controllers/admin/rewardsControllers.js');
var adminAffiliatesControllers = require('@/controllers/admin/affiliatesControllers.js');
var adminSupportControllers = require('@/controllers/admin/supportControllers.js');
var adminSettingsControllers = require('@/controllers/admin/settingsControllers.js');
var adminAuthenticationControllers = require('@/controllers/admin/authenticationControllers.js');
var adminInvoicesControllers = require('@/controllers/admin/invoicesControllers.js');
var adminPaypalControllers = require('@/controllers/admin/paypalControllers.js');

router.get('/', adminControllers.adminUnset);

router.get('/dashboard/', adminDashboardControllers.adminDashboardUnset);
router.get('/dashboard/summary', adminDashboardControllers.adminDashboardSummary);
router.get('/dashboard/games', adminDashboardControllers.adminDashboardGamesUnset);
router.get('/dashboard/games/summary', adminDashboardControllers.adminDashboardGamesSummary);
router.get('/dashboard/games/:game', adminDashboardControllers.adminDashboardGame);
router.get('/dashboard/payments', adminDashboardControllers.adminDashboardPaymentsDefault);
router.get('/dashboard/payments/summary', adminDashboardControllers.adminDashboardPaymentsSummary);
router.get('/dashboard/payments/deposits', adminDashboardControllers.adminDashboardPaymentsDeposits);
router.get('/dashboard/payments/withdrawals', adminDashboardControllers.adminDashboardPaymentsWithdrawals);

router.get('/users', adminUsersControllers.adminUsers);
router.get('/users/:userid', adminUsersControllers.adminUser);

router.get('/payments', adminPaymentsControllers.adminPayments);

router.get('/games', adminGamesControllers.adminGames);
router.get('/gamebots', adminGamesControllers.adminGamebots);

router.get('/bonuscodes', adminRewardsControllers.adminBonusCodes);

router.get('/invoices', adminInvoicesControllers.adminInvoices);

router.get('/paypal', adminPaypalControllers.adminPaypal);
router.get('/paypal/connect', adminPaypalControllers.adminPaypalConnect);
router.get('/paypal/callback', adminPaypalControllers.adminPaypalCallback);
router.post('/paypal/disconnect', adminPaypalControllers.adminPaypalDisconnect);

router.get('/referrals', adminAffiliatesControllers.adminReferrals);
router.get('/referrals/:userid', adminAffiliatesControllers.adminReferral);

router.get('/support', adminSupportControllers.adminSupportUnset);
router.get('/support/requests', adminSupportControllers.adminSupportRequests);
router.get('/support/requests/:id', adminSupportControllers.adminSupportRequest);

router.get('/settings', adminSettingsControllers.adminSettings);
router.get('/authentication', adminAuthenticationControllers.authentication);

module.exports = router;