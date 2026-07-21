function overflowMenu(edata) {
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
  , __lines = "<div class=\"overflow-menu p-1 pointer\">\n    <%- icon({\n        icon: 'ellipsis-h',\n        id: null,\n        className: 'text-muted-foreground size-3.5'\n    }); %>\n\n    <div class=\"overflow-menu-select transition duration-200\">\n        <%- overflowMenuPopover({ items }); %>\n    </div>\n</div>"
  , __filename = undefined;
try {
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
  with (locals || {}) {
    ; __append("<div class=\"overflow-menu p-1 pointer\">\n    ")
    ; __line = 2
    ; __append( icon({
        icon: 'ellipsis-h',
        id: null,
        className: 'text-muted-foreground size-3.5'
    }) )
    ; __line = 6
    ; __append("\n\n    <div class=\"overflow-menu-select transition duration-200\">\n        ")
    ; __line = 9
    ; __append( overflowMenuPopover({ items }) )
    ; __append("\n    </div>\n</div>")
    ; __line = 11
  }
  return __output;
} catch (e) {
  rethrow(e, __lines, __filename, __line, escapeFn);
}

}
    return anonymous(edata);
}