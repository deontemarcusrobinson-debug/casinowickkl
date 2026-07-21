function jackpotHistorySkeleton(edata) {
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
  , __lines = "<div class=\"jackpot_historyitem bg-card flex flex-col gap-1 rounded-1 p-1\">\n    <div class=\"flex justify-between items-center gap-2 p-2\" style=\"background: #BBBBD240;\">\n        <div class=\"skeleton skeleton-card text-large-box\"></div>\n        <div class=\"bg-secondary py-1 px-2 rounded-1 pointer font-bold\">Provably Fair</div>\n    </div>\n\n    <div class=\"jackpot-grid-bets bg-card rounded-1\" id=\"jackpot_betlist\">\n        <% for(var i = 0; i < 3; i++){ %>\n            <%- jackpotBetSkeleton(); %>\n        <% } %>\n    </div>\n</div>"
  , __filename = undefined;
try {
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
  with (locals || {}) {
    ; __append("<div class=\"jackpot_historyitem bg-card flex flex-col gap-1 rounded-1 p-1\">\n    <div class=\"flex justify-between items-center gap-2 p-2\" style=\"background: #BBBBD240;\">\n        <div class=\"skeleton skeleton-card text-large-box\"></div>\n        <div class=\"bg-secondary py-1 px-2 rounded-1 pointer font-bold\">Provably Fair</div>\n    </div>\n\n    <div class=\"jackpot-grid-bets bg-card rounded-1\" id=\"jackpot_betlist\">\n        ")
    ; __line = 8
    ;  for(var i = 0; i < 3; i++){ 
    ; __append("\n            ")
    ; __line = 9
    ; __append( jackpotBetSkeleton() )
    ; __append("\n        ")
    ; __line = 10
    ;  } 
    ; __append("\n    </div>\n</div>")
    ; __line = 12
  }
  return __output;
} catch (e) {
  rethrow(e, __lines, __filename, __line, escapeFn);
}

}
    return anonymous(edata);
}