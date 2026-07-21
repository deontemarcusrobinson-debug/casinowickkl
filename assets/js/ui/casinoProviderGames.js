function casinoProviderGames(edata) {
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
  , __lines = "<div class=\"section flex flex-col gap-2\">\n    <div class=\"flex flex-row justify-between items-center gap-2\">\n        <img class=\"max-h-8\" src=\"<%= image %>\">\n\n        <div class=\"flex flex-row items-center gap-2\">\n            <a href=\"/casino/providers/<%= id %>\"><button class=\"button button-hover button-accent shadow-2\">View All</button></a>\n\n            <div class=\"flex flex-row items-center gap-1\">\n                <button class=\"action button button-hover button-accent shadow-2\" data-type=\"left\">\n                    <%- icon({\n                        icon: 'chevron-left',\n                        id: null,\n                        className: 'size-3'\n                    }); %>\n                </button>\n\n                <button class=\"action button button-hover button-accent shadow-2\" data-type=\"right\">\n                    <%- icon({\n                        icon: 'chevron-right',\n                        id: null,\n                        className: 'size-3'\n                    }); %>\n                </button>\n            </div>\n        </div>\n    </div>\n\n    <div class=\"swiper\">\n        <div class=\"casino-games list flex flex-row transition duration-500\">\n            <% games.forEach(function(item){ %>\n                <%- casinoGame(item); %>\n            <% }); %>\n        </div>\n    </div>\n</div>"
  , __filename = undefined;
try {
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
  with (locals || {}) {
    ; __append("<div class=\"section flex flex-col gap-2\">\n    <div class=\"flex flex-row justify-between items-center gap-2\">\n        <img class=\"max-h-8\" src=\"")
    ; __line = 3
    ; __append(escapeFn( image ))
    ; __append("\">\n\n        <div class=\"flex flex-row items-center gap-2\">\n            <a href=\"/casino/providers/")
    ; __line = 6
    ; __append(escapeFn( id ))
    ; __append("\"><button class=\"button button-hover button-accent shadow-2\">View All</button></a>\n\n            <div class=\"flex flex-row items-center gap-1\">\n                <button class=\"action button button-hover button-accent shadow-2\" data-type=\"left\">\n                    ")
    ; __line = 10
    ; __append( icon({
                        icon: 'chevron-left',
                        id: null,
                        className: 'size-3'
                    }) )
    ; __line = 14
    ; __append("\n                </button>\n\n                <button class=\"action button button-hover button-accent shadow-2\" data-type=\"right\">\n                    ")
    ; __line = 18
    ; __append( icon({
                        icon: 'chevron-right',
                        id: null,
                        className: 'size-3'
                    }) )
    ; __line = 22
    ; __append("\n                </button>\n            </div>\n        </div>\n    </div>\n\n    <div class=\"swiper\">\n        <div class=\"casino-games list flex flex-row transition duration-500\">\n            ")
    ; __line = 30
    ;  games.forEach(function(item){ 
    ; __append("\n                ")
    ; __line = 31
    ; __append( casinoGame(item) )
    ; __append("\n            ")
    ; __line = 32
    ;  }); 
    ; __append("\n        </div>\n    </div>\n</div>")
    ; __line = 35
  }
  return __output;
} catch (e) {
  rethrow(e, __lines, __filename, __line, escapeFn);
}

}
    return anonymous(edata);
}