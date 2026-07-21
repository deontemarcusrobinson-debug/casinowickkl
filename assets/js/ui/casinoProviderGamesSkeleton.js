function casinoProviderGamesSkeleton(edata) {
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
  , __lines = "<div class=\"section flex flex-col gap-2\">\n    <div class=\"flex flex-row justify-between items-center gap-2\">\n        <div class=\"skeleton skeleton-card h-8 w-20 rounded-1\"></div>\n\n        <div class=\"flex flex-row items-center gap-2\">\n            <div class=\"flex flex-row items-center gap-1\">\n                <button class=\"button button-hover button-accent shadow-2 disabled\">\n                    <%- icon({\n                        icon: 'chevron-left',\n                        className: 'size-3'\n                    }); %>\n                </button>\n\n                <button class=\"button button-hover button-accent shadow-2 disabled\">\n                    <%- icon({\n                        icon: 'chevron-right',\n                        className: 'size-3'\n                    }); %>\n                </button>\n            </div>\n        </div>\n    </div>\n\n    <div class=\"swiper\">\n        <div class=\"casino-games list flex flex-row transition duration-500\">\n            <% for(var i = 0; i < 20; i++){ %>\n                <%- casinoGameSkeleton(); %>\n            <% } %>\n        </div>\n    </div>\n</div>"
  , __filename = undefined;
try {
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
  with (locals || {}) {
    ; __append("<div class=\"section flex flex-col gap-2\">\n    <div class=\"flex flex-row justify-between items-center gap-2\">\n        <div class=\"skeleton skeleton-card h-8 w-20 rounded-1\"></div>\n\n        <div class=\"flex flex-row items-center gap-2\">\n            <div class=\"flex flex-row items-center gap-1\">\n                <button class=\"button button-hover button-accent shadow-2 disabled\">\n                    ")
    ; __line = 8
    ; __append( icon({
                        icon: 'chevron-left',
                        className: 'size-3'
                    }) )
    ; __line = 11
    ; __append("\n                </button>\n\n                <button class=\"button button-hover button-accent shadow-2 disabled\">\n                    ")
    ; __line = 15
    ; __append( icon({
                        icon: 'chevron-right',
                        className: 'size-3'
                    }) )
    ; __line = 18
    ; __append("\n                </button>\n            </div>\n        </div>\n    </div>\n\n    <div class=\"swiper\">\n        <div class=\"casino-games list flex flex-row transition duration-500\">\n            ")
    ; __line = 26
    ;  for(var i = 0; i < 20; i++){ 
    ; __append("\n                ")
    ; __line = 27
    ; __append( casinoGameSkeleton() )
    ; __append("\n            ")
    ; __line = 28
    ;  } 
    ; __append("\n        </div>\n    </div>\n</div>")
    ; __line = 31
  }
  return __output;
} catch (e) {
  rethrow(e, __lines, __filename, __line, escapeFn);
}

}
    return anonymous(edata);
}