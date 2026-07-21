function jackpotBetSkeleton(edata) {
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
  , __lines = "<div class=\"item flex items-center justify-between flex-row gap-1 bg-secondary p-2 rounded-1\" style=\"border-left: solid 4px var(--muted-foreground);\">\n    <div class=\"flex items-center gap-1 overflow-hidden p-1\">\n        <%- userAvatarSkeleton({ type: 'card', size: 'size-8' }); %>\n\n        <div class=\"flex flex-col items-start justify-center gap-1\">\n            <div class=\"skeleton skeleton-card text-medium-box\"></div>\n            <div class=\"skeleton skeleton-card text-large-box\"></div>\n        </div>\n    </div>\n\n    <div class=\"skeleton skeleton-card text-medium-box\"></div>\n</div>"
  , __filename = undefined;
try {
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
  with (locals || {}) {
    ; __append("<div class=\"item flex items-center justify-between flex-row gap-1 bg-secondary p-2 rounded-1\" style=\"border-left: solid 4px var(--muted-foreground);\">\n    <div class=\"flex items-center gap-1 overflow-hidden p-1\">\n        ")
    ; __line = 3
    ; __append( userAvatarSkeleton({ type: 'card', size: 'size-8' }) )
    ; __append("\n\n        <div class=\"flex flex-col items-start justify-center gap-1\">\n            <div class=\"skeleton skeleton-card text-medium-box\"></div>\n            <div class=\"skeleton skeleton-card text-large-box\"></div>\n        </div>\n    </div>\n\n    <div class=\"skeleton skeleton-card text-medium-box\"></div>\n</div>")
    ; __line = 12
  }
  return __output;
} catch (e) {
  rethrow(e, __lines, __filename, __line, escapeFn);
}

}
    return anonymous(edata);
}