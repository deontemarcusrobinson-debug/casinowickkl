function tableAffiliatesReferredUsersRow(edata) {
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
  , __lines = "<div class=\"table-row\">\n    <div class=\"table-column text-left\">\n        <%- userField({ user }); %>\n    </div>\n\n    <div class=\"table-column text-left\">\n        <div class=\"flex flex-row items-center justify-start gap-1\">\n            <%- icon({\n                icon: 'diamond',\n                className: 'text-primary size-4'\n            }); %>\n\n            <span><%= wagered %></span>\n        </div>\n    </div>\n    <div class=\"table-column text-left\">\n        <div class=\"flex flex-row items-center justify-start gap-1\">\n            <%- icon({\n                icon: 'diamond',\n                className: 'text-primary size-4'\n            }); %>\n\n            <span><%= deposited %></span>\n        </div>\n    </div>\n    <div class=\"table-column text-left\">\n        <div class=\"flex flex-row items-center justify-start gap-1\">\n            <%- icon({\n                icon: 'diamond',\n                className: 'text-primary size-4'\n            }); %>\n\n            <span><%= earnings.wagered %></span>\n        </div>\n    </div>\n    <div class=\"table-column text-left\">\n        <div class=\"flex flex-row items-center justify-start gap-1\">\n            <%- icon({\n                icon: 'diamond',\n                className: 'text-primary size-4'\n            }); %>\n\n            <span><%= earnings.deposited %></span>\n        </div>\n    </div>\n    <div class=\"table-column text-right\">\n        <div class=\"flex flex-row items-center justify-end gap-1\">\n            <%- icon({\n                icon: 'diamond',\n                className: 'text-primary size-4'\n            }); %>\n\n            <span><%= earnings.total %></span>\n        </div>\n    </div>\n</div>"
  , __filename = undefined;
try {
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
  with (locals || {}) {
    ; __append("<div class=\"table-row\">\n    <div class=\"table-column text-left\">\n        ")
    ; __line = 3
    ; __append( userField({ user }) )
    ; __append("\n    </div>\n\n    <div class=\"table-column text-left\">\n        <div class=\"flex flex-row items-center justify-start gap-1\">\n            ")
    ; __line = 8
    ; __append( icon({
                icon: 'diamond',
                className: 'text-primary size-4'
            }) )
    ; __line = 11
    ; __append("\n\n            <span>")
    ; __line = 13
    ; __append(escapeFn( wagered ))
    ; __append("</span>\n        </div>\n    </div>\n    <div class=\"table-column text-left\">\n        <div class=\"flex flex-row items-center justify-start gap-1\">\n            ")
    ; __line = 18
    ; __append( icon({
                icon: 'diamond',
                className: 'text-primary size-4'
            }) )
    ; __line = 21
    ; __append("\n\n            <span>")
    ; __line = 23
    ; __append(escapeFn( deposited ))
    ; __append("</span>\n        </div>\n    </div>\n    <div class=\"table-column text-left\">\n        <div class=\"flex flex-row items-center justify-start gap-1\">\n            ")
    ; __line = 28
    ; __append( icon({
                icon: 'diamond',
                className: 'text-primary size-4'
            }) )
    ; __line = 31
    ; __append("\n\n            <span>")
    ; __line = 33
    ; __append(escapeFn( earnings.wagered ))
    ; __append("</span>\n        </div>\n    </div>\n    <div class=\"table-column text-left\">\n        <div class=\"flex flex-row items-center justify-start gap-1\">\n            ")
    ; __line = 38
    ; __append( icon({
                icon: 'diamond',
                className: 'text-primary size-4'
            }) )
    ; __line = 41
    ; __append("\n\n            <span>")
    ; __line = 43
    ; __append(escapeFn( earnings.deposited ))
    ; __append("</span>\n        </div>\n    </div>\n    <div class=\"table-column text-right\">\n        <div class=\"flex flex-row items-center justify-end gap-1\">\n            ")
    ; __line = 48
    ; __append( icon({
                icon: 'diamond',
                className: 'text-primary size-4'
            }) )
    ; __line = 51
    ; __append("\n\n            <span>")
    ; __line = 53
    ; __append(escapeFn( earnings.total ))
    ; __append("</span>\n        </div>\n    </div>\n</div>")
    ; __line = 56
  }
  return __output;
} catch (e) {
  rethrow(e, __lines, __filename, __line, escapeFn);
}

}
    return anonymous(edata);
}