function jackpotHistory(edata) {
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
  , __lines = "<div class=\"jackpot_historyitem bg-card flex flex-col gap-1 rounded-1 p-1\">\n    <% var style = 'style=\"background: ' + bets[winner].color + '40;\"'; %>\n\n    <div class=\"flex justify-between items-center gap-2 p-2\" <%- style %>>\n        <div class=\"font-bold\"><%= bets[winner].user.name %> won the pot valued at <%= amount %> coins with a chance of <%= chance %>%</div>\n        <div class=\"bg-secondary py-1 px-2 rounded-1 pointer font-bold fair-results\" data-fair=\"<%= JSON.stringify(fair) %>\">Provably Fair</div>\n    </div>\n\n    <div class=\"jackpot-grid-bets bg-card rounded-1\" id=\"jackpot_betlist\">\n        <% bets.forEach(function(item){ %>\n            <%- jackpotBet(item); %>\n        <% }); %>\n    </div>\n</div>"
  , __filename = undefined;
try {
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
  with (locals || {}) {
    ; __append("<div class=\"jackpot_historyitem bg-card flex flex-col gap-1 rounded-1 p-1\">\n    ")
    ; __line = 2
    ;  var style = 'style="background: ' + bets[winner].color + '40;"'; 
    ; __append("\n\n    <div class=\"flex justify-between items-center gap-2 p-2\" ")
    ; __line = 4
    ; __append( style )
    ; __append(">\n        <div class=\"font-bold\">")
    ; __line = 5
    ; __append(escapeFn( bets[winner].user.name ))
    ; __append(" won the pot valued at ")
    ; __append(escapeFn( amount ))
    ; __append(" coins with a chance of ")
    ; __append(escapeFn( chance ))
    ; __append("%</div>\n        <div class=\"bg-secondary py-1 px-2 rounded-1 pointer font-bold fair-results\" data-fair=\"")
    ; __line = 6
    ; __append(escapeFn( JSON.stringify(fair) ))
    ; __append("\">Provably Fair</div>\n    </div>\n\n    <div class=\"jackpot-grid-bets bg-card rounded-1\" id=\"jackpot_betlist\">\n        ")
    ; __line = 10
    ;  bets.forEach(function(item){ 
    ; __append("\n            ")
    ; __line = 11
    ; __append( jackpotBet(item) )
    ; __append("\n        ")
    ; __line = 12
    ;  }); 
    ; __append("\n    </div>\n</div>")
    ; __line = 14
  }
  return __output;
} catch (e) {
  rethrow(e, __lines, __filename, __line, escapeFn);
}

}
    return anonymous(edata);
}