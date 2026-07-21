function tableUserCasinoHistoryRow(edata) {
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
  , __lines = "<div class=\"table-row <%= { win: 'text-success', loss: 'text-danger' }[status] %>\">\n    <div class=\"table-column text-left\">#<%= id %></div>\n    <div class=\"table-column text-left capitalize\"><%= game.split('_').join(' ') %></div>\n\n    <div class=\"table-column text-left\">\n        <div class=\"flex flex-row items-center justify-start gap-1\">\n            <%- icon({\n                icon: 'diamond',\n                id: null,\n                className: 'text-primary size-4'\n            }); %>\n\n            <span><%= amount %></span>\n        </div>\n    </div>\n\n    <div class=\"table-column text-left\">\n        <div class=\"flex flex-row items-center justify-start gap-1\">\n            <%- icon({\n                icon: 'diamond',\n                id: null,\n                className: 'text-primary size-4'\n            }); %>\n\n            <span><%= profit %></span>\n        </div>\n    </div>\n\n    <div class=\"table-column text-left\"><%= date %></div>\n</div>"
  , __filename = undefined;
try {
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
  with (locals || {}) {
    ; __append("<div class=\"table-row ")
    ; __append(escapeFn( { win: 'text-success', loss: 'text-danger' }[status] ))
    ; __append("\">\n    <div class=\"table-column text-left\">#")
    ; __line = 2
    ; __append(escapeFn( id ))
    ; __append("</div>\n    <div class=\"table-column text-left capitalize\">")
    ; __line = 3
    ; __append(escapeFn( game.split('_').join(' ') ))
    ; __append("</div>\n\n    <div class=\"table-column text-left\">\n        <div class=\"flex flex-row items-center justify-start gap-1\">\n            ")
    ; __line = 7
    ; __append( icon({
                icon: 'diamond',
                id: null,
                className: 'text-primary size-4'
            }) )
    ; __line = 11
    ; __append("\n\n            <span>")
    ; __line = 13
    ; __append(escapeFn( amount ))
    ; __append("</span>\n        </div>\n    </div>\n\n    <div class=\"table-column text-left\">\n        <div class=\"flex flex-row items-center justify-start gap-1\">\n            ")
    ; __line = 19
    ; __append( icon({
                icon: 'diamond',
                id: null,
                className: 'text-primary size-4'
            }) )
    ; __line = 23
    ; __append("\n\n            <span>")
    ; __line = 25
    ; __append(escapeFn( profit ))
    ; __append("</span>\n        </div>\n    </div>\n\n    <div class=\"table-column text-left\">")
    ; __line = 29
    ; __append(escapeFn( date ))
    ; __append("</div>\n</div>")
    ; __line = 30
  }
  return __output;
} catch (e) {
  rethrow(e, __lines, __filename, __line, escapeFn);
}

}
    return anonymous(edata);
}