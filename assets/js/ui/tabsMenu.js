function tabsMenu(edata) {
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
  , __lines = "<div class=\"tabs-menu <%= type %> flex flex-wrap flex-row gap-2 border-card\">\n    <% items.forEach(function(item, index){ %>\n        <a href=\"<%= item.href %>\"><button class=\"button transition duration-200 <% if(item.active){ %>active<% } %>\"><%= item.label %></button></a>\n    <% }); %>\n</div>"
  , __filename = undefined;
try {
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
  with (locals || {}) {
    ; __append("<div class=\"tabs-menu ")
    ; __append(escapeFn( type ))
    ; __append(" flex flex-wrap flex-row gap-2 border-card\">\n    ")
    ; __line = 2
    ;  items.forEach(function(item, index){ 
    ; __append("\n        <a href=\"")
    ; __line = 3
    ; __append(escapeFn( item.href ))
    ; __append("\"><button class=\"button transition duration-200 ")
    ;  if(item.active){ 
    ; __append("active")
    ;  } 
    ; __append("\">")
    ; __append(escapeFn( item.label ))
    ; __append("</button></a>\n    ")
    ; __line = 4
    ;  }); 
    ; __append("\n</div>")
    ; __line = 5
  }
  return __output;
} catch (e) {
  rethrow(e, __lines, __filename, __line, escapeFn);
}

}
    return anonymous(edata);
}