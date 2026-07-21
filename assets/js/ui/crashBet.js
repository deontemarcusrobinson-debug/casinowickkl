function crashBet(edata) {
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
  , __lines = "<div class=\"item table-row <% if(cashedout) { %>text-success<% } else if(ended) { %>text-danger<% } else { %>text-primary<% } %>\" data-id=\"<%= id %>\">\n    <div class=\"table-column text-left\">\n        <%- userAvatar({ user, size: 'size-8' }); %>\n    </div>\n\n    <div class=\"table-column text-left\"><span class=\"at\"><% if(at) { %><%= at %><% } else { %>-<% } %></span></div>\n    <div class=\"table-column text-left\"><span class=\"total\"><%= amount %></span></div>\n    <div class=\"table-column text-left\"><span class=\"profit\"><% if(profit) { %><%= profit %><% } else { %>-<% } %></span></div>\n</div>"
  , __filename = undefined;
try {
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
  with (locals || {}) {
    ; __append("<div class=\"item table-row ")
    ;  if(cashedout) { 
    ; __append("text-success")
    ;  } else if(ended) { 
    ; __append("text-danger")
    ;  } else { 
    ; __append("text-primary")
    ;  } 
    ; __append("\" data-id=\"")
    ; __append(escapeFn( id ))
    ; __append("\">\n    <div class=\"table-column text-left\">\n        ")
    ; __line = 3
    ; __append( userAvatar({ user, size: 'size-8' }) )
    ; __append("\n    </div>\n\n    <div class=\"table-column text-left\"><span class=\"at\">")
    ; __line = 6
    ;  if(at) { 
    ; __append(escapeFn( at ))
    ;  } else { 
    ; __append("-")
    ;  } 
    ; __append("</span></div>\n    <div class=\"table-column text-left\"><span class=\"total\">")
    ; __line = 7
    ; __append(escapeFn( amount ))
    ; __append("</span></div>\n    <div class=\"table-column text-left\"><span class=\"profit\">")
    ; __line = 8
    ;  if(profit) { 
    ; __append(escapeFn( profit ))
    ;  } else { 
    ; __append("-")
    ;  } 
    ; __append("</span></div>\n</div>")
    ; __line = 9
  }
  return __output;
} catch (e) {
  rethrow(e, __lines, __filename, __line, escapeFn);
}

}
    return anonymous(edata);
}