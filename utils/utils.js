var request = require('request');
var crypto = require('crypto');

var { loggerError } = require('@/lib/logger.js');

var { roundedToFixed, getFormatAmount } = require('@/utils/formatAmount.js');

var config = require('@/config/config.js');

function getLocationByIp(ip, callback){
    var fallback = { country: 'XX', region: 'Unknown', city: 'Unknown' };

    if(!ip || ip === '::1' || ip === '127.0.0.1' || String(ip).indexOf('127.') === 0 || String(ip).indexOf('10.') === 0 || String(ip).indexOf('192.168.') === 0 || String(ip).indexOf('fc') === 0 || String(ip).indexOf('fd') === 0) {
        return callback(null, fallback);
    }

    var token = config.app.ipinfo && config.app.ipinfo.api_token;
    if(!token) {
        return callback(null, fallback);
    }

    request('https://ipinfo.io/' + ip + '/json?token=' + token, function(err1, response1) {
		if(err1) {
            loggerError(err1);
            return callback(null, fallback);
        }

        if(!response1 || response1.statusCode != 200) {
            loggerError('Unable to load IP location for ' + ip + '. Response body: ' + (response1 && response1.body));
            return callback(null, fallback);
        }

        try {
            var res = JSON.parse(response1.body);
            callback(null, {
                country: res.country || 'XX',
                region: res.region || 'Unknown',
                city: res.city || 'Unknown'
            });
        } catch (e) {
            loggerError(e);
            callback(null, fallback);
        }
	});
}

function getUserDevice(agent) {
    var browser = { name: '', version: '' };
    var platform = 'Unknown';
    var os = { name: '', version: '' };
    var device = 'Unknown';

    let mobile = /Mobile/i.test(agent);

    // Browser detection
    if (/MSIE/i.test(agent) && !/Opera/i.test(agent)) {
        browser.name = 'Internet Explorer';

        var match = agent.match(/MSIE (\d+(\.\d+)?)/i);
        if(match) browser.version = match[1];
    } else if (/Firefox/i.test(agent)) {
        browser.name = 'Mozilla Firefox';

        var match = agent.match(/Firefox\/(\d+(\.\d+)?)/i);
        if(match) browser.version = match[1];
    } else if (/Chrome/i.test(agent)) {
        if(agent.includes('Brave')) browser.name = 'Brave Browser';
        else if(agent.includes('HuaweiBrowser')) browser.name = 'Huawei Browser';
        else if(agent.includes('Edg')) browser.name = 'Microsoft Edge';
        else if(agent.includes('YaBrowser')) browser.name = 'Yandex Browser';
        else if(agent.includes('UCBrowser')) browser.name = 'UC Browser';
        else if(agent.includes('SamsungBrowser')) browser.name = 'Samsung Browser';
        else if(agent.includes('OPR') || agent.includes('Opera')) browser.name = 'Opera';
        else browser.name = 'Google Chrome';

        var match = agent.match(/Chrome\/(\d+(\.\d+)?)/i);
        if(match) browser.version = match[1];
    } else if (/Safari/i.test(agent)) {
        browser.name = 'Apple Safari';

        var match = agent.match(/Version\/(\d+(\.\d+)?)/i);
        if(match) browser.version = match[1];
    } else if (/Opera/i.test(agent)) {
        browser.name = 'Opera';

        var match = agent.match(/Opera\/(\d+(\.\d+)?)/i);
        if(match) browser.version = match[1];
    }

    // Platform & OS detection
    if (/Windows/i.test(agent)) {
        platform = 'Windows';
        os.name = 'Windows';

        var match = agent.match(/NT ([\d\.]+)(;\s+([^\)]+))?/i);
        var versions = { '10.0': '10', '6.3': '8.1', '6.2': '8', '6.1': '7', '6.0': 'Vista', '5.1': 'XP', '5.0': '2000' };
        if(match && versions[match[1]]) os.version = versions[match[1]];
        if(match && match[3]) device = match[3].split(';')[0].trim();
    } else if (/iPhone/i.test(agent)) {
        platform = 'iOS';
        os.name = 'iPhone';

        var match = agent.match(/iPhone OS ([\d\.]+)(;\s+([^\)]+))?/i);
        if(match) os.version = match[1];
        if(match && match[3]) device = match[3].split(';')[0].trim();
    } else if (/iPad/i.test(agent)) {
        platform = 'iOS';
        os.name = 'iPad';

        var match = agent.match(/CPU OS ([\d\.]+)(;\s+([^\)]+))?/i);
        if(match) os.version = match[1];
        if(match && match[3]) device = match[3].split(';')[0].trim();
    } else if (/Macintosh/i.test(agent)) {
        platform = 'Mac OS X';
        os.name = 'Macintosh';

        var match = agent.match(/Mac OS X ([\d\.]+)(;\s+([^\)]+))?/i);
        if(match) os.version = match[1];
        if(match && match[3]) device = match[3].split(';')[0].trim();
    } else if (/Android/i.test(agent)) {
        platform = 'Android';
        os.name = /Mobile/i.test(agent) ? 'Android Phone' : 'Android Tablet';

        var match = agent.match(/Android ([\d\.]+)(;\s+([^\)]+))?/i);
        if(match) os.version = match[1];
        if(match && match[3]) device = match[3].split(';')[0].trim();
    } else if (/Linux/i.test(agent)) {
        platform = 'Linux';

        if (/Ubuntu/i.test(agent)) {
            os.name = 'Ubuntu';

            var match = agent.match(/Ubuntu\/([\d\.]+)(;\s+([^\)]+))?/i);
            if(match) os.version = match[1];
            if(match && match[3]) device = match[3].split(';')[0].trim();
        }
    }

    return { browser, platform, os, device, mobile };
}

function haveRankPermission(permission, rank){
    if(config.app.permissions[permission] === undefined) return false;

    return config.app.permissions[permission].includes(config.app.ranks[rank]);
}

function verifyRecaptcha(recaptcha, callback){
    // If reCAPTCHA keys are not set yet, do not block rewards/login flows
    if(!config.app.recaptcha || !config.app.recaptcha.private_key || !config.app.recaptcha.public_key) {
        return callback(true);
    }

	request('https://www.google.com/recaptcha/api/siteverify?secret=' + config.app.recaptcha.private_key + '&response=' + recaptcha, function(err1, response1) {
		if(err1) {
			loggerError(err1);

			return callback(false);
		}

        if(!response1 || response1.statusCode != 200) return callback(false);

		var body = JSON.parse(response1.body);

		if(body.success !== undefined) return callback(body.success);

		callback(false);
	});
}

function calculateLevel(xp){
	if(xp < config.app.level.base) return {
        level: 0,
        start: 0,
        next: config.app.level.base,
        have: xp
    };
;
    var level = Math.floor(Math.pow(xp / config.app.level.base, 1 / config.app.level.ratio));

	if(level > 100) level = 100;

    var start = Math.floor(config.app.level.base * Math.pow(Math.min(level + 1, 100) - 1, config.app.level.ratio));
	var next = Math.floor(config.app.level.base * Math.pow(Math.min(level + 1, 100), config.app.level.ratio));

	return {
		level: level,
		start: 0,
		next: next - start,
		have: (xp > next ? next : xp) - start
	};
}

function parseItemName(name){
	var infos = {
		title: null,
		subtitle: null,
		exterior: null
	};

	var match = /^\s*(.*?)\s*(?:\|\s*(.*?)\s*(?:\((Battle-Scarred|Well-Worn|Field-Tested|Minimal Wear|Factory New)\))?)?$/.exec(name);

	if(match && match[2]) {
		infos.title = match[1] || null;
		infos.subtitle = match[2] || null;
		infos.exterior = match[3] || null;
	} else infos.title = name.trim();

	return infos;
}

function escapeHTML(string) {
    string = string.replace(/&/g, '&amp;');
    string = string.replace(/</g, '&lt;');
    string = string.replace(/>/g, '&gt;');
    string = string.replace(/"/g, '&quot;');
    string = string.replace(/'/g, '&#039;');

    return string;
}

function isJsonString(string) {
    try {
        JSON.parse(string);
    } catch (e) {
        return false;
    }

    return true;
}

function setObjectProperty(object, path, value){
	var parts = path.split('..');

  	for (var i = 0; i < parts.length - 1; ++i) {
      	var key = parts[i];
    	object = object[key];
    }

    object[parts[parts.length - 1]] = value;
};

function lowercaseKeysObject(object) {
	return Object.keys(object).reduce((accumulator, key) => {
		accumulator[key.toLowerCase()] = object[key];

		return accumulator;
	}, {});
}

function sortObject(object) {
    return Object.keys(object).sort().reduce((result, key) => {
        result[key] = (object[key] && typeof object[key] === 'object') ? sortObject(object[key]) : object[key];
        return result;
    }, {});
}

function getAmountCommission(amount, commission){
	return roundedToFixed(amount * commission / 100, 5);
}

function getXpByAmount(amount){
	var xp = Math.floor(getFormatAmount(amount) * 100);

	if(new Date().getDay() == 0 || new Date().getDay() == 6) xp *= 2;

	return xp;
}

function getAffiliateCommission(deposited, type){
	var tiers = config.app.affiliates.requirements.map((amount, tier) => ({ amount, tier })).filter(a => deposited < a.amount);
    var tier = tiers.length > 0 ? tiers[0].tier - 1 : config.app.affiliates.requirements.length - 1;

	return config.app.affiliates.earnings[type][tier];
}

function generateSessionToken(){
    return crypto.randomBytes(32).toString('hex');
}

function generateHexCode(length) {
    var bytes = Math.ceil(length / 2);

    return crypto.randomBytes(bytes).toString('hex').slice(0, length);
}

function generateSecurityCode(length) {
    var token = '';

    while (token.length < length) {
        var byte = crypto.randomBytes(1)[0];

        if (byte < 250) token += String(byte % 10);
    }

    return token;
}

function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function countDecimals(value) {
    if (Math.floor(value) !== value) return value.toString().split('.')[1].length || 0;

	return 0;
}

function capitalizeText(str){
	return str.charAt(0).toUpperCase() + str.slice(1);
}

function getSlug(str){
    if(str == null) return null;

    return str.toLowerCase().normalize('NFD').replace(/[^\w\s\-]/gi, '').trim().replace(/[\s\-_]+/g, '_')
}

function snakeToCamel(str) {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

module.exports = {
	getLocationByIp, getUserDevice, haveRankPermission, verifyRecaptcha, calculateLevel, parseItemName,
	escapeHTML, isJsonString, setObjectProperty, lowercaseKeysObject, sortObject, getAmountCommission,
	getXpByAmount, getAffiliateCommission, generateSessionToken, generateHexCode, generateSecurityCode, getRandomInt, countDecimals,
    capitalizeText, getSlug, snakeToCamel
};