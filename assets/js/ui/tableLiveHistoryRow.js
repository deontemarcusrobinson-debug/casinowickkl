function tableLiveHistoryRow(edata) {
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
  , __lines = "<div class=\"item table-row\">\n    <a class=\"table-column text-left\" href=\"<%= {\n        original: '/' + game.id,\n        casino: '/casino/slots/' + game.id\n    }[category] %>\">\n        <div class=\"flex flex-row items-center gap-2\">\n            <%- icon({\n                icon: {\n                    original: game.id,\n                    casino: 'casino'\n                }[category],\n                className: 'size-5'\n            }); %>\n\n            <div class=\"font-bold capitalize\"><%= game.name %></div>\n        </div>\n    </a>\n\n    <div class=\"table-column text-left\">\n        <%- userField({ user }); %>\n    </div>\n\n    <div class=\"table-column text-left\">\n        <div class=\"flex flex-row items-center justify-start gap-1\">\n            <%- icon({\n                icon: 'diamond',\n                className: 'text-primary size-4'\n            }); %>\n\n            <span><%= amount %></span>\n        </div>\n    </div>\n\n    <div class=\"table-column text-left\"><%= multiplier %>x</div>\n\n    <% if(winning > 0) { %>\n        <div class=\"table-column text-right success\">\n            <div class=\"flex flex-row items-center justify-end gap-1\">\n                <%- icon({\n                    icon: 'diamond',\n                    className: 'text-primary size-4'\n                }); %>\n\n                <span>+<%= winning %></span>\n            </div>\n        </div>\n    <% } else { %>\n        <div class=\"table-column text-right\">\n            <div class=\"flex flex-row items-center justify-end gap-1\">\n                <%- icon({\n                    icon: 'diamond',\n                    className: 'text-primary size-4'\n                }); %>\n\n                <span><%= winning %></span>\n            </div>\n        </div>\n    <% } %>\n</div>"
  , __filename = undefined;
try {
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
  with (locals || {}) {
    ; __append("<div class=\"item table-row\">\n    <a class=\"table-column text-left\" href=\"")
    ; __line = 2
    ; __append(escapeFn( {
        original: '/' + game.id,
        casino: '/casino/slots/' + game.id
    }[category] ))
    ; __line = 5
    ; __append("\">\n        <div class=\"flex flex-row items-center gap-2\">\n            ")
    ; __line = 7
    ; __append( icon({
                icon: {
                    original: game.id,
                    casino: 'casino'
                }[category],
                className: 'size-5'
            }) )
    ; __line = 13
    ; __append("\n\n            <div class=\"font-bold capitalize\">")
    ; __line = 15
    ; __append(escapeFn( game.name ))
    ; __append("</div>\n        </div>\n    </a>\n\n    <div class=\"table-column text-left\">\n        ")
    ; __line = 20
    ; __append( userField({ user }) )
    ; __append("\n    </div>\n\n    <div class=\"table-column text-left\">\n        <div class=\"flex flex-row items-center justify-start gap-1\">\n            ")
    ; __line = 25
    ; __append( icon({
                icon: 'diamond',
                className: 'text-primary size-4'
            }) )
    ; __line = 28
    ; __append("\n\n            <span>")
    ; __line = 30
    ; __append(escapeFn( amount ))
    ; __append("</span>\n        </div>\n    </div>\n\n    <div class=\"table-column text-left\">")
    ; __line = 34
    ; __append(escapeFn( multiplier ))
    ; __append("x</div>\n\n    ")
    ; __line = 36
    ;  if(winning > 0) { 
    ; __append("\n        <div class=\"table-column text-right success\">\n            <div class=\"flex flex-row items-center justify-end gap-1\">\n                ")
    ; __line = 39
    ; __append( icon({
                    icon: 'diamond',
                    className: 'text-primary size-4'
                }) )
    ; __line = 42
    ; __append("\n\n                <span>+")
    ; __line = 44
    ; __append(escapeFn( winning ))
    ; __append("</span>\n            </div>\n        </div>\n    ")
    ; __line = 47
    ;  } else { 
    ; __append("\n        <div class=\"table-column text-right\">\n            <div class=\"flex flex-row items-center justify-end gap-1\">\n                ")
    ; __line = 50
    ; __append( icon({
                    icon: 'diamond',
                    className: 'text-primary size-4'
                }) )
    ; __line = 53
    ; __append("\n\n                <span>")
    ; __line = 55
    ; __append(escapeFn( winning ))
    ; __append("</span>\n            </div>\n        </div>\n    ")
    ; __line = 58
    ;  } 
    ; __append("\n</div>")
    ; __line = 59
  }
  return __output;
} catch (e) {
  rethrow(e, __lines, __filename, __line, escapeFn);
}

}
    return anonymous(edata);
}