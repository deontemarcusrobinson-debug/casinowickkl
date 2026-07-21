function rouletteJackpotSkeleton(edata) {
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
  , __lines = "<div class=\"roulette-jackpot flex flex-col gap-4 justify-center items-center\" id=\"roulette_jackpot\">\n    <div class=\"flex flex-row gap-2 justify-center items-center\" id=\"roulette_jackpot_greens\">\n        <% for(var i = 1; i <= 3; i++) { %>\n            <div class=\"skeleton skeleton-card item-box\"></div>\n        <% } %>\n    </div>\n\n    <div class=\"skeleton skeleton-card amount-box\"></div>\n</div>"
  , __filename = undefined;
try {
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
  with (locals || {}) {
    ; __append("<div class=\"roulette-jackpot flex flex-col gap-4 justify-center items-center\" id=\"roulette_jackpot\">\n    <div class=\"flex flex-row gap-2 justify-center items-center\" id=\"roulette_jackpot_greens\">\n        ")
    ; __line = 3
    ;  for(var i = 1; i <= 3; i++) { 
    ; __append("\n            <div class=\"skeleton skeleton-card item-box\"></div>\n        ")
    ; __line = 5
    ;  } 
    ; __append("\n    </div>\n\n    <div class=\"skeleton skeleton-card amount-box\"></div>\n</div>")
    ; __line = 9
  }
  return __output;
} catch (e) {
  rethrow(e, __lines, __filename, __line, escapeFn);
}

}
    return anonymous(edata);
}