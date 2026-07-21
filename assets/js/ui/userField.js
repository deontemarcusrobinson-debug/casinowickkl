function userField(edata) {
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
  , __lines = "<% if(user.anonymous){ %>\n    <div class=\"flex items-center gap-2\">\n        <%- userAvatar({ user, size: 'size-8' }); %>\n\n        <div class=\"text-left w-full truncate\"><%= user.name %></div>\n    </div>\n<% } else { %>\n    <a class=\"flex items-center gap-2\" href=\"/user/<%= user.userid %>\" target=\"_blank\">\n        <%- userAvatar({ user, size: 'size-8' }); %>\n\n        <div class=\"text-left w-full truncate\"><%= user.name %></div>\n    </a>\n<% } %>"
  , __filename = undefined;
try {
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
  with (locals || {}) {
    ;  if(user.anonymous){ 
    ; __append("\n    <div class=\"flex items-center gap-2\">\n        ")
    ; __line = 3
    ; __append( userAvatar({ user, size: 'size-8' }) )
    ; __append("\n\n        <div class=\"text-left w-full truncate\">")
    ; __line = 5
    ; __append(escapeFn( user.name ))
    ; __append("</div>\n    </div>\n")
    ; __line = 7
    ;  } else { 
    ; __append("\n    <a class=\"flex items-center gap-2\" href=\"/user/")
    ; __line = 8
    ; __append(escapeFn( user.userid ))
    ; __append("\" target=\"_blank\">\n        ")
    ; __line = 9
    ; __append( userAvatar({ user, size: 'size-8' }) )
    ; __append("\n\n        <div class=\"text-left w-full truncate\">")
    ; __line = 11
    ; __append(escapeFn( user.name ))
    ; __append("</div>\n    </a>\n")
    ; __line = 13
    ;  } 
  }
  return __output;
} catch (e) {
  rethrow(e, __lines, __filename, __line, escapeFn);
}

}
    return anonymous(edata);
}