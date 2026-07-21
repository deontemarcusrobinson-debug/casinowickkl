function tableRouletteJackpotHistoryRow(edata) {
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
  , __lines = "<div class=\"table-row relative\">\n    <div class=\"table-column text-left\">\n        <div class=\"flex flex-row items-center justify-start gap-1\">\n            <%- icon({\n                icon: 'diamond',\n                id: null,\n                className: 'text-primary size-4'\n            }); %>\n\n            <span><%= amount %></span>\n        </div>\n    </div>\n\n    <div class=\"table-column text-left\"><%= winners %></div>\n    <div class=\"table-column text-left\"><%= time %></div>\n\n    <div class=\"table-column\">\n        <div class=\"flex flex-row items-center justify-end\">\n            <%- overflowMenu({\n                items: [\n                    {\n                        link: false,\n                        destructive: false,\n                        label: 'View winners',\n                        icon: 'eye',\n                        className: 'roulette-jackpot-winners',\n                        attributes: [\n                            { name: 'data-id', value: id }\n                        ]\n                    }\n                ]\n            }); %>\n        </div>\n    </div>\n</div>"
  , __filename = undefined;
try {
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
  with (locals || {}) {
    ; __append("<div class=\"table-row relative\">\n    <div class=\"table-column text-left\">\n        <div class=\"flex flex-row items-center justify-start gap-1\">\n            ")
    ; __line = 4
    ; __append( icon({
                icon: 'diamond',
                id: null,
                className: 'text-primary size-4'
            }) )
    ; __line = 8
    ; __append("\n\n            <span>")
    ; __line = 10
    ; __append(escapeFn( amount ))
    ; __append("</span>\n        </div>\n    </div>\n\n    <div class=\"table-column text-left\">")
    ; __line = 14
    ; __append(escapeFn( winners ))
    ; __append("</div>\n    <div class=\"table-column text-left\">")
    ; __line = 15
    ; __append(escapeFn( time ))
    ; __append("</div>\n\n    <div class=\"table-column\">\n        <div class=\"flex flex-row items-center justify-end\">\n            ")
    ; __line = 19
    ; __append( overflowMenu({
                items: [
                    {
                        link: false,
                        destructive: false,
                        label: 'View winners',
                        icon: 'eye',
                        className: 'roulette-jackpot-winners',
                        attributes: [
                            { name: 'data-id', value: id }
                        ]
                    }
                ]
            }) )
    ; __line = 32
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