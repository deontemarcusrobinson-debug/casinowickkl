function breadcrumbTrail(edata) {
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
  , __lines = "<div class=\"flex flex-row items-center gap-2\">\n    <% items.forEach(function(item, index){ %>\n        <% if(index < items.length - 1){ %>\n            <a class=\"underline\" href=\"/admin/<%= items.slice(0, index + 1).map(a => a.page).join('/') %>\">\n                <div class=\"font-bold text-sm\"><%= item.name %></div>\n            </a>\n\n            <%- icon({\n                icon: 'chevron-right',\n                className: 'text-muted-foreground size-2.5'\n            }); %>\n        <% } else { %>\n            <div class=\"font-bold text-sm\"><%= item.name %></div>\n        <% } %>\n    <% }); %>\n</div>"
  , __filename = undefined;
try {
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
  with (locals || {}) {
    ; __append("<div class=\"flex flex-row items-center gap-2\">\n    ")
    ; __line = 2
    ;  items.forEach(function(item, index){ 
    ; __append("\n        ")
    ; __line = 3
    ;  if(index < items.length - 1){ 
    ; __append("\n            <a class=\"underline\" href=\"/admin/")
    ; __line = 4
    ; __append(escapeFn( items.slice(0, index + 1).map(a => a.page).join('/') ))
    ; __append("\">\n                <div class=\"font-bold text-sm\">")
    ; __line = 5
    ; __append(escapeFn( item.name ))
    ; __append("</div>\n            </a>\n\n            ")
    ; __line = 8
    ; __append( icon({
                icon: 'chevron-right',
                className: 'text-muted-foreground size-2.5'
            }) )
    ; __line = 11
    ; __append("\n        ")
    ; __line = 12
    ;  } else { 
    ; __append("\n            <div class=\"font-bold text-sm\">")
    ; __line = 13
    ; __append(escapeFn( item.name ))
    ; __append("</div>\n        ")
    ; __line = 14
    ;  } 
    ; __append("\n    ")
    ; __line = 15
    ;  }); 
    ; __append("\n</div>")
    ; __line = 16
  }
  return __output;
} catch (e) {
  rethrow(e, __lines, __filename, __line, escapeFn);
}

}
    return anonymous(edata);
}