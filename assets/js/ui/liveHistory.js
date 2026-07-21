function liveHistory(edata) {
    function anonymous(locals, escapeFn, include, rethrow
) {
rethrow = rethrow || function rethrow(err, str, flnm, lineno, esc) {
  var lines = str.split('\n');
  var start = Math.max(lineno - 3, 0);
  var end = Math.min(lines.length, lineno + 3);
  var filename = esc(flnm);
  // Error context
  var context = lines.slice(start, end).map(function (line, i){
    var curr = i + start + 1;
    return (curr == lineno ? ' >> ' : '    ')
      + curr
      + '| '
      + line;
  }).join('\n');

  // Alter exception message
  err.path = filename;
  err.message = (filename || 'ejs') + ':'
    + lineno + '\n'
    + context + '\n\n'
    + err.message;

  throw err;
};
escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
var __line = 1
  , __lines = "<div class=\"bet-history flex flex-col items-center gap-2\">\n\t<div class=\"bet-select flex flex-row items-center justify-center gap-1 bg-secondary p-1 rounded-1 overflow-hidden\">\n\t\t<button class=\"history-load button w-full transition duration-200 active\" data-type=\"all_bets\">All bets</button>\n\t\t<button class=\"history-load button w-full transition duration-200\" data-type=\"big_bets\">Big bets</button>\n\t\t<% if(page != 'home') { %><button class=\"history-load button w-full transition duration-200\" data-type=\"game_bets\">Game bets</button><% } %>\n\t\t<button class=\"history-load button w-full transition duration-200\" data-type=\"my_bets\">My bets</button>\n\t</div>\n\n\t<div class=\"table-container w-full\">\n\t\t<div class=\"table-header\">\n\t\t\t<div class=\"table-row\">\n\t\t\t\t<div class=\"table-column text-left\">Game</div>\n\t\t\t\t<div class=\"table-column text-left\">User</div>\n\t\t\t\t<div class=\"table-column text-left\">Wager</div>\n\t\t\t\t<div class=\"table-column text-left\">Multiplier</div>\n\t\t\t\t<div class=\"table-column text-right\">Payout</div>\n\t\t\t</div>\n\t\t</div>\n\n\t\t<div class=\"table-body\" id=\"history_list\">\n\t\t\t<% for(var i = 0; i < 10; i++){ %>\n                <%- tableLiveHistoryRowSkeleton(); %>\n            <% } %>\n\t\t</div>\n\t</div>\n</div>"
  , __filename = undefined;
try {
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
  with (locals || {}) {
    ; __append("<div class=\"bet-history flex flex-col items-center gap-2\">\n	<div class=\"bet-select flex flex-row items-center justify-center gap-1 bg-secondary p-1 rounded-1 overflow-hidden\">\n		<button class=\"history-load button w-full transition duration-200 active\" data-type=\"all_bets\">All bets</button>\n		<button class=\"history-load button w-full transition duration-200\" data-type=\"big_bets\">Big bets</button>\n		")
    ; __line = 5
    ;  if(page != 'home') { 
    ; __append("<button class=\"history-load button w-full transition duration-200\" data-type=\"game_bets\">Game bets</button>")
    ;  } 
    ; __append("\n		<button class=\"history-load button w-full transition duration-200\" data-type=\"my_bets\">My bets</button>\n	</div>\n\n	<div class=\"table-container w-full\">\n		<div class=\"table-header\">\n			<div class=\"table-row\">\n				<div class=\"table-column text-left\">Game</div>\n				<div class=\"table-column text-left\">User</div>\n				<div class=\"table-column text-left\">Wager</div>\n				<div class=\"table-column text-left\">Multiplier</div>\n				<div class=\"table-column text-right\">Payout</div>\n			</div>\n		</div>\n\n		<div class=\"table-body\" id=\"history_list\">\n			")
    ; __line = 21
    ;  for(var i = 0; i < 10; i++){ 
    ; __append("\n                ")
    ; __line = 22
    ; __append( tableLiveHistoryRowSkeleton() )
    ; __append("\n            ")
    ; __line = 23
    ;  } 
    ; __append("\n		</div>\n	</div>\n</div>")
    ; __line = 26
  }
  return __output;
} catch (e) {
  rethrow(e, __lines, __filename, __line, escapeFn);
}

}
    return anonymous(edata);
}