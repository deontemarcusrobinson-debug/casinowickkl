function homeCasinoGame(edata) {
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
  , __lines = "<a class=\"item transition duration-500 <% if(!enable){ %>disabled<% } %>\" href=\"/casino/slots/<%= id %>\">\n    <div class=\"info flex flex-col items-center justify-center flex flex-col justify-center bg-secondary bg-opacity-50 transition duration-200\">\n        <% if(enable){ %>\n            <div class=\"rtp text-sm font-bold\"><%= rtp %>% RTP</div>\n\n            <div class=\"play flex flex-col items-center justify-center transition duration-500\">\n                <%- icon({\n                    icon: 'play',\n                    id: null,\n                    className: 'size-6/12'\n                }); %>\n            </div>\n        <% } else { %>\n            <div class=\"description text-sm text-center font-bold\">This game is temporary disabled!</div>\n        <% } %>\n\n        <div class=\"name flex flex-col gap-1\">\n            <div class=\"text-base text-center font-bold truncate w-full\"><%= name %></div>\n            <div class=\"text-xs text-center text-muted-foreground font-bold uppercase truncate w-full\"><%= provider %></div>\n        </div>\n    </div>\n\n    <div class=\"image transition duration-500\"><img src=\"<%= image %>\"></div>\n\n    <div class=\"playing flex flex-row items-center gap-1\">\n        <span class=\"playing-dot\"></span>\n        <span class=\"playing-count\"><%= typeof playing !== 'undefined' && playing != null ? playing : 0 %></span>\n        <span class=\"playing-label\">playing</span>\n    </div>\n</a>"
  , __filename = undefined;
try {
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
  with (locals || {}) {
    ; __append("<a class=\"item transition duration-500 ")
    ;  if(!enable){ 
    ; __append("disabled")
    ;  } 
    ; __append("\" href=\"/casino/slots/")
    ; __append(escapeFn( id ))
    ; __append("\">\n    <div class=\"info flex flex-col items-center justify-center flex flex-col justify-center bg-secondary bg-opacity-50 transition duration-200\">\n        ")
    ; __line = 3
    ;  if(enable){ 
    ; __append("\n            <div class=\"rtp text-sm font-bold\">")
    ; __line = 4
    ; __append(escapeFn( rtp ))
    ; __append("% RTP</div>\n\n            <div class=\"play flex flex-col items-center justify-center transition duration-500\">\n                ")
    ; __line = 7
    ; __append( icon({
                    icon: 'play',
                    id: null,
                    className: 'size-6/12'
                }) )
    ; __line = 11
    ; __append("\n            </div>\n        ")
    ; __line = 13
    ;  } else { 
    ; __append("\n            <div class=\"description text-sm text-center font-bold\">This game is temporary disabled!</div>\n        ")
    ; __line = 15
    ;  } 
    ; __append("\n\n        <div class=\"name flex flex-col gap-1\">\n            <div class=\"text-base text-center font-bold truncate w-full\">")
    ; __line = 18
    ; __append(escapeFn( name ))
    ; __append("</div>\n            <div class=\"text-xs text-center text-muted-foreground font-bold uppercase truncate w-full\">")
    ; __line = 19
    ; __append(escapeFn( provider ))
    ; __append("</div>\n        </div>\n    </div>\n\n    <div class=\"image transition duration-500\"><img src=\"")
    ; __line = 23
    ; __append(escapeFn( image ))
    ; __append("\"></div>\n\n    <div class=\"playing flex flex-row items-center gap-1\">\n        <span class=\"playing-dot\"></span>\n        <span class=\"playing-count\">")
    ; __line = 27
    ; __append(escapeFn( typeof playing !== 'undefined' && playing != null ? playing : 0 ))
    ; __append("</span>\n        <span class=\"playing-label\">playing</span>\n    </div>\n</a>")
    ; __line = 30
  }
  return __output;
} catch (e) {
  rethrow(e, __lines, __filename, __line, escapeFn);
}

}
    return anonymous(edata);
}