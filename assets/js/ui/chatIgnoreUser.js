function chatIgnoreUser(edata) {
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
  , __lines = "<div class=\"item bg-card rounded-2 flex flex-row gap-2 items-center px-4 py-2 w-full\" data-userid=\"<%= user.userid %>\">\n    <%- userAvatar({ user, size: 'size-10' }); %>\n\n    <div class=\"flex flex-col gap-1 justify-center w-full overflow-hidden\">\n        <div class=\"text-base truncate\"><%= user.name %></div>\n        <div class=\"text-xs truncate\"><%= time %></div>\n    </div>\n\n    <button class=\"chat_send_command button button-hover button-primary shadow-2\" data-command=\"/unignore <%= user.userid %>\">Unignore</button>\n</div>"
  , __filename = undefined;
try {
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
  with (locals || {}) {
    ; __append("<div class=\"item bg-card rounded-2 flex flex-row gap-2 items-center px-4 py-2 w-full\" data-userid=\"")
    ; __append(escapeFn( user.userid ))
    ; __append("\">\n    ")
    ; __line = 2
    ; __append( userAvatar({ user, size: 'size-10' }) )
    ; __append("\n\n    <div class=\"flex flex-col gap-1 justify-center w-full overflow-hidden\">\n        <div class=\"text-base truncate\">")
    ; __line = 5
    ; __append(escapeFn( user.name ))
    ; __append("</div>\n        <div class=\"text-xs truncate\">")
    ; __line = 6
    ; __append(escapeFn( time ))
    ; __append("</div>\n    </div>\n\n    <button class=\"chat_send_command button button-hover button-primary shadow-2\" data-command=\"/unignore ")
    ; __line = 9
    ; __append(escapeFn( user.userid ))
    ; __append("\">Unignore</button>\n</div>")
    ; __line = 10
  }
  return __output;
} catch (e) {
  rethrow(e, __lines, __filename, __line, escapeFn);
}

}
    return anonymous(edata);
}