function rouletteJackpot(edata) {
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
  , __lines = "<div class=\"roulette-jackpot flex flex-col gap-4 justify-center items-center\" id=\"roulette_jackpot\">\n    <div class=\"flex flex-row gap-2 justify-center items-center\" id=\"roulette_jackpot_greens\">\n        <% for(var i = 1; i <= 3; i++) { %>\n            <div class=\"item shadow-2 flex row items-center <% if(greens >= i) { %>active<% } %>\" data-green=\"<%= i %>\">\n                <%- icon({\n                    icon: 'hat',\n                    className: 'opacity-70 text-foreground h-8/12 w-full'\n                }); %>\n            </div>\n        <% } %>\n    </div>\n\n    <div class=\"roulette-jackpot-info flex flex-row items-center justify-center gap-2\">\n        <%- icon({\n            icon: 'diamond',\n            className: 'text-primary size-6'\n        }); %>\n\n        <span class=\"amount\" id=\"roulette_jackpot_total\"><%= amount %></span>\n\n        <%- icon({\n            icon: 'info',\n            id: 'roulette_jackpot_history',\n            className: 'text-muted-foreground size-5 pointer'\n        }); %>\n    </div>\n</div>"
  , __filename = undefined;
try {
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
  with (locals || {}) {
    ; __append("<div class=\"roulette-jackpot flex flex-col gap-4 justify-center items-center\" id=\"roulette_jackpot\">\n    <div class=\"flex flex-row gap-2 justify-center items-center\" id=\"roulette_jackpot_greens\">\n        ")
    ; __line = 3
    ;  for(var i = 1; i <= 3; i++) { 
    ; __append("\n            <div class=\"item shadow-2 flex row items-center ")
    ; __line = 4
    ;  if(greens >= i) { 
    ; __append("active")
    ;  } 
    ; __append("\" data-green=\"")
    ; __append(escapeFn( i ))
    ; __append("\">\n                ")
    ; __line = 5
    ; __append( icon({
                    icon: 'hat',
                    className: 'opacity-70 text-foreground h-8/12 w-full'
                }) )
    ; __line = 8
    ; __append("\n            </div>\n        ")
    ; __line = 10
    ;  } 
    ; __append("\n    </div>\n\n    <div class=\"roulette-jackpot-info flex flex-row items-center justify-center gap-2\">\n        ")
    ; __line = 14
    ; __append( icon({
            icon: 'diamond',
            className: 'text-primary size-6'
        }) )
    ; __line = 17
    ; __append("\n\n        <span class=\"amount\" id=\"roulette_jackpot_total\">")
    ; __line = 19
    ; __append(escapeFn( amount ))
    ; __append("</span>\n\n        ")
    ; __line = 21
    ; __append( icon({
            icon: 'info',
            id: 'roulette_jackpot_history',
            className: 'text-muted-foreground size-5 pointer'
        }) )
    ; __line = 25
    ; __append("\n    </div>\n</div>")
    ; __line = 27
  }
  return __output;
} catch (e) {
  rethrow(e, __lines, __filename, __line, escapeFn);
}

}
    return anonymous(edata);
}