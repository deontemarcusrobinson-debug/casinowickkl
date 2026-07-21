function setCookie(key, value){
	var exp = new Date();

	exp.setTime(exp.getTime() + 365 * 24 * 60 * 60 * 1000);
	document.cookie = key + '=' + value + '; expires=' + exp.toUTCString() + '; path=/';
}

function getCookie(key){
	var patt = new RegExp(key + '=([^;]*)');

	var matches = patt.exec(document.cookie);

	if(matches) return matches[1];

	return null;
}