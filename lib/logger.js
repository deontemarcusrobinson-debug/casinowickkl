var log4js = require('log4js');
var fs = require('fs');

var { dateFormat } = require('@/utils/formatDate.js')

var logger = log4js.getLogger();

function ensureDir(dir){
	try {
		if(!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
	} catch(e) {
		// ignore — console logging still works
	}
}

function initializeLogs() {
	ensureDir('logs');
	ensureDir('errors');

	var date = dateFormat(new Date(), 'dd.MM.yyyy');

	log4js.configure({
		appenders: {
			out: { type: 'console' },
			app: { type: 'file', filename: 'logs/' + date + '.log' }
		},
		categories: {
			default: { appenders: [ 'out', 'app' ], level: 'all' }
		}
	});

	setTimeout(function(){
		initializeLogs();
	}, 24 * 3600 * 1000);
}

function writeError(error){
	ensureDir('errors');

	var date = dateFormat(new Date(), 'dd-MM-yyyyThh:mm:ss.sss');

	try{
		error = error.stack.toString();
	} catch(e) {
		error = error.toString();
	}

	fs.writeFile('errors/' + date + '.error', error, function(err1){
		if(err1) return logger.error(err1);

		logger.error('Error whrited successfully!');
	});
}

function loggerInfo(message){
	logger.info(message);
}

function loggerDebug(message){
	logger.debug(message);
}

function loggerTrace(message){
	logger.trace(message);
}

function loggerWarn(message){
	logger.warn(message);
}

function loggerError(message){
	logger.error(message);

	writeError(message);
}

function loggerFatal(message){
	logger.fatal(message);

	writeError(message);
}

module.exports = {
	initializeLogs,
	loggerInfo, loggerDebug, loggerTrace, loggerWarn, loggerError, loggerFatal
};