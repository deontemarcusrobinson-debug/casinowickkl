function overflowMenuPopover(edata) {
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
  , __lines = "<div class=\"overflow-menu-popover flex flex-col bg-secondary border-2 border-card text-nowrap overflow-hidden rounded-2\">\n    <% items.forEach(function(item){ %>\n        <% if(item.link){ %>\n            <a href=\"<%= item.href %>\" class=\"overflow-menu-option <% if(item.destructive){ %>destructive<% } %> flex flex-row items-center gap-1 bg-secondary flex flex-row items-center gap-2 px-4 py-3 font-bold <% if(typeof item.className !== 'undefined' && item.className != null){ %><%= item.className %><% } %>\" <% if(typeof item.id !== 'undefined') { %>id=\"<%= item.id %>\"<% } %> <% if(typeof item.attributes !== 'undefined' && Array.isArray(item.attributes)){ %><%- item.attributes.map(a => a.name + '=\"' + a.value.toString().replace(/\"/g, '&quot;') + '\"').join(' ') %><% } %>>\n                <% if(typeof item.icon !== 'undefined') { %>\n                    <%- icon({\n                        icon: item.icon,\n                        id: null,\n                        className: 'size-3.5'\n                    }); %>\n                <% } %>\n\n                <span><%= item.label %></span>\n            </a>\n        <% } else { %>\n            <div class=\"overflow-menu-option <% if(item.destructive){ %>destructive<% } %> flex flex-row items-center gap-1 bg-secondary flex flex-row items-center gap-2 px-4 py-3 font-bold <% if(typeof item.className !== 'undefined' && item.className != null){ %><%= item.className %><% } %>\" <% if(typeof item.id !== 'undefined') { %>id=\"<%= item.id %>\"<% } %> <% if(typeof item.attributes !== 'undefined' && Array.isArray(item.attributes)){ %><%- item.attributes.map(a => a.name + '=\"' + a.value.toString().replace(/\"/g, '&quot;') + '\"').join(' ') %><% } %>>\n                <% if(typeof item.icon !== 'undefined') { %>\n                    <%- icon({\n                        icon: item.icon,\n                        id: null,\n                        className: 'size-3.5'\n                    }); %>\n                <% } %>\n\n                <span><%= item.label %></span>\n            </div>\n        <% } %>\n    <% }); %>\n</div>"
  , __filename = undefined;
try {
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
  with (locals || {}) {
    ; __append("<div class=\"overflow-menu-popover flex flex-col bg-secondary border-2 border-card text-nowrap overflow-hidden rounded-2\">\n    ")
    ; __line = 2
    ;  items.forEach(function(item){ 
    ; __append("\n        ")
    ; __line = 3
    ;  if(item.link){ 
    ; __append("\n            <a href=\"")
    ; __line = 4
    ; __append(escapeFn( item.href ))
    ; __append("\" class=\"overflow-menu-option ")
    ;  if(item.destructive){ 
    ; __append("destructive")
    ;  } 
    ; __append(" flex flex-row items-center gap-1 bg-secondary flex flex-row items-center gap-2 px-4 py-3 font-bold ")
    ;  if(typeof item.className !== 'undefined' && item.className != null){ 
    ; __append(escapeFn( item.className ))
    ;  } 
    ; __append("\" ")
    ;  if(typeof item.id !== 'undefined') { 
    ; __append("id=\"")
    ; __append(escapeFn( item.id ))
    ; __append("\"")
    ;  } 
    ; __append(" ")
    ;  if(typeof item.attributes !== 'undefined' && Array.isArray(item.attributes)){ 
    ; __append( item.attributes.map(a => a.name + '="' + a.value.toString().replace(/"/g, '&quot;') + '"').join(' ') )
    ;  } 
    ; __append(">\n                ")
    ; __line = 5
    ;  if(typeof item.icon !== 'undefined') { 
    ; __append("\n                    ")
    ; __line = 6
    ; __append( icon({
                        icon: item.icon,
                        id: null,
                        className: 'size-3.5'
                    }) )
    ; __line = 10
    ; __append("\n                ")
    ; __line = 11
    ;  } 
    ; __append("\n\n                <span>")
    ; __line = 13
    ; __append(escapeFn( item.label ))
    ; __append("</span>\n            </a>\n        ")
    ; __line = 15
    ;  } else { 
    ; __append("\n            <div class=\"overflow-menu-option ")
    ; __line = 16
    ;  if(item.destructive){ 
    ; __append("destructive")
    ;  } 
    ; __append(" flex flex-row items-center gap-1 bg-secondary flex flex-row items-center gap-2 px-4 py-3 font-bold ")
    ;  if(typeof item.className !== 'undefined' && item.className != null){ 
    ; __append(escapeFn( item.className ))
    ;  } 
    ; __append("\" ")
    ;  if(typeof item.id !== 'undefined') { 
    ; __append("id=\"")
    ; __append(escapeFn( item.id ))
    ; __append("\"")
    ;  } 
    ; __append(" ")
    ;  if(typeof item.attributes !== 'undefined' && Array.isArray(item.attributes)){ 
    ; __append( item.attributes.map(a => a.name + '="' + a.value.toString().replace(/"/g, '&quot;') + '"').join(' ') )
    ;  } 
    ; __append(">\n                ")
    ; __line = 17
    ;  if(typeof item.icon !== 'undefined') { 
    ; __append("\n                    ")
    ; __line = 18
    ; __append( icon({
                        icon: item.icon,
                        id: null,
                        className: 'size-3.5'
                    }) )
    ; __line = 22
    ; __append("\n                ")
    ; __line = 23
    ;  } 
    ; __append("\n\n                <span>")
    ; __line = 25
    ; __append(escapeFn( item.label ))
    ; __append("</span>\n            </div>\n        ")
    ; __line = 27
    ;  } 
    ; __append("\n    ")
    ; __line = 28
    ;  }); 
    ; __append("\n</div>")
    ; __line = 29
  }
  return __output;
} catch (e) {
  rethrow(e, __lines, __filename, __line, escapeFn);
}

}
    return anonymous(edata);
}