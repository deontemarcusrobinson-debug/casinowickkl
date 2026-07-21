function makeDate(date){
	var months = [ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ];

	var type_time = date.getHours() < 12 ? 'AM' : 'PM';

	return pad(date.getDate(), 2) + ' ' + months[date.getMonth()] + ' ' + date.getFullYear() + ', ' + pad(date.getHours() % 12, 2) + ':' + pad(date.getMinutes(), 2) + ' ' + type_time;
}

function dateFormat(date, format){
	var year = date.getFullYear();
	var month = date.getMonth() + 1;
	var day = date.getDate();
	var hour = date.getHours();
	var minutes = date.getMinutes();
	var seconds = date.getSeconds();
	var milliseconds = date.getMilliseconds();

	month = pad(month, 2);
	day = pad(day, 2);
	hour = pad(hour, 2);
	minutes = pad(minutes, 2);
	seconds = pad(seconds, 2);
	milliseconds = pad(milliseconds, 2);

	format = format.replace('sss', milliseconds);
	format = format.replace('ss', seconds);
	format = format.replace('mm', minutes);
	format = format.replace('hh', hour);
	format = format.replace('dd', day);
	format = format.replace('MM', month);
	format = format.replace('yyyy', year);

	return format;
}

function getFormatSeconds(time){
	var days = Math.floor(time / (24 * 60 * 60));
	var hours = Math.floor((time % (24 * 60 * 60)) / (60 * 60));
	var minutes = Math.floor((time % (60 * 60)) / 60);
	var seconds = Math.floor(time % 60);

	return {
		days: pad(days, 2),
		hours: pad(hours, 2),
		minutes: pad(minutes, 2),
		seconds: pad(seconds, 2)
	};
}

function getSteamTime(time){
    var date = new Date(time * 1000);

    var year = date.getUTCFullYear();
    var month = date.getUTCMonth();
    var day = date.getUTCDate();

    var timestamp = Math.floor(Date.UTC(year, month, day, 7, 0, 0) / 1000);

    if(timestamp < time) timestamp += 24 * 60 * 60;

    return timestamp;
}

function pad(s, n) {
	return String(s).padStart(n, '0');
}

function toISO(d) {
	return d.getFullYear() + '-' + pad(d.getMonth() + 1, 2) + '-' + pad(d.getDate(), 2);
}

function time() {
	return Math.floor(Date.now() / 1000);
}

module.exports = {
	makeDate, dateFormat, getFormatSeconds, getSteamTime, pad, toISO, time
};