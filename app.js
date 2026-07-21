require('dotenv').config();
require('module-alias/register');

global.BASE_DIR = __dirname;

var os = require('os');

var io = require('@/lib/socket.js');

var { initializeLogs, loggerWarn, loggerFatal } = require('@/lib/logger.js');

var { initializeSocket } = require('@/utils/socket.js');

var chatService = require('@/services/chatService.js');

var historyService = require('@/services/historyService.js');

var rainService = require('@/services/rainService.js');

var rouletteService = require('@/services/games/rouletteService.js');
var crashService = require('@/services/games/crashService.js');
var jackpotService = require('@/services/games/jackpotService.js');
var coinflipService = require('@/services/games/coinflipService.js');
var minesweeperService = require('@/services/games/minesweeperService.js');
var towerService = require('@/services/games/towerService.js');
var casinoService = require('@/services/games/casinoService.js');

var cashService = require('@/services/trading/cashService.js');

var cryptoService = require('@/services/trading/cryptoService.js');

process.on('uncaughtException', function (error) {
	loggerFatal(error);
});

setInterval(function(){
    var heapUsed = process.memoryUsage().heapUsed / 1000000;

    loggerWarn('[SERVER] Memory usage: ' + heapUsed.toFixed(2) + 'MB');
    loggerWarn('[SERVER] CPU load: ' + os.loadavg()[0].toFixed(2) + '%');
}, 1 * 60 * 1000);

initializeLogs();

initializeSocket(io);

chatService.initializeChat();

rainService.initializeGame();

historyService.initializeHistory();

rouletteService.initializeGame();
crashService.initializeGame();
jackpotService.initializeGame();
coinflipService.loadGames();
minesweeperService.loadGames();
towerService.loadGames();
casinoService.initializeCasino();

cashService.initializeTransactions();

cryptoService.initializeCurrencies();

io.on('connection', function(socket) {
    // CONNECT
    require('@/events/connectEvents.js')(socket);

    // MIDDLEWARES
    socket.use(require('@/middleware/socket/limiter.js')(socket));
    socket.use(require('@/middleware/socket/user.js')(socket));
    socket.use(require('@/middleware/socket/banip.js')(socket));
    socket.use(require('@/middleware/socket/maintenance.js')(socket));
    socket.use(require('@/middleware/socket/bansite.js')(socket));

    // EVENTS
    socket.on('error', require('@/events/errorEvents.js')(socket));
	socket.on('join', require('@/events/joinEvents.js')(socket));
	socket.on('request', require('@/events/requestEvents.js')(socket));
	socket.on('disconnect', require('@/events/disconnectEvents.js')(socket));
});