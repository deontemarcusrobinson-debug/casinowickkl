function inputsFileField(edata) {
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
  , __lines = "<div class=\"file-field relative w-full <% if(typeof disabled !== 'undefined' && disabled) { %>disabled<% } %>\">\n    <div class=\"file-wrapper flex flex-col items-center justify-center rounded-2 p-2 transition duration-200 w-full\">\n        <input type=\"file\" class=\"file-element w-full h-full <% if(typeof className !== 'undefined' && className != null){ %><%= className %><% } %>\" <% if(typeof id !== 'undefined' && id != null) { %>id=\"<%= id %>\"<% } %> <% if(typeof attributes !== 'undefined' && Array.isArray(attributes)){ %><%- attributes.map(a => a.name + '=\"' + a.value.toString().replace(/\"/g, '&quot;') + '\"').join(' ') %><% } %> <% if(typeof accept !== 'undefined') { %>accept=\"<%= accept %>\"<% } %>>\n\n        <div class=\"file-empty flex flex-col items-center justify-center gap-4 transition duration-200 w-full h-full\">\n            <%- icon({\n                icon: 'upload',\n                id: null,\n                className: 'file-empty-icon text-muted-foreground size-9 transition duration-200'\n            }); %>\n\n            <% if(typeof title !== 'undefined' && typeof subtitle !== 'undefined') { %>\n                <div class=\"flex flex-col items-center justify-center gap-2\">\n                    <% if(typeof title !== 'undefined') { %>\n                        <div class=\"file-empty-title text-sm font-bold\"><%- title %></div>\n                    <% } %>\n\n                    <% if(typeof subtitle !== 'undefined') { %>\n                        <div class=\"file-empty-subtitle text-2xs text-muted-foreground\"><%= subtitle %></div>\n                    <% } %>\n                </div>\n            <% } else if(typeof title !== 'undefined') { %>\n                <div class=\"file-empty-title text-sm font-bold\"><%- title %></div>\n            <% } else if(typeof subtitle !== 'undefined') { %>\n                <div class=\"file-empty-subtitle text-2xs text-muted-foreground\"><%= subtitle %></div>\n            <% } %>\n        </div>\n\n        <img class=\"file-cover rounded-2 w-full h-full transition duration-200 <% if(typeof preview !== 'undefined' && preview != null) { %>active<% } %>\" src=\"<% if(typeof preview !== 'undefined' && preview != null) { %><%= preview %><% } %>\">\n    </div>\n</div>"
  , __filename = undefined;
try {
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
  with (locals || {}) {
    ; __append("<div class=\"file-field relative w-full ")
    ;  if(typeof disabled !== 'undefined' && disabled) { 
    ; __append("disabled")
    ;  } 
    ; __append("\">\n    <div class=\"file-wrapper flex flex-col items-center justify-center rounded-2 p-2 transition duration-200 w-full\">\n        <input type=\"file\" class=\"file-element w-full h-full ")
    ; __line = 3
    ;  if(typeof className !== 'undefined' && className != null){ 
    ; __append(escapeFn( className ))
    ;  } 
    ; __append("\" ")
    ;  if(typeof id !== 'undefined' && id != null) { 
    ; __append("id=\"")
    ; __append(escapeFn( id ))
    ; __append("\"")
    ;  } 
    ; __append(" ")
    ;  if(typeof attributes !== 'undefined' && Array.isArray(attributes)){ 
    ; __append( attributes.map(a => a.name + '="' + a.value.toString().replace(/"/g, '&quot;') + '"').join(' ') )
    ;  } 
    ; __append(" ")
    ;  if(typeof accept !== 'undefined') { 
    ; __append("accept=\"")
    ; __append(escapeFn( accept ))
    ; __append("\"")
    ;  } 
    ; __append(">\n\n        <div class=\"file-empty flex flex-col items-center justify-center gap-4 transition duration-200 w-full h-full\">\n            ")
    ; __line = 6
    ; __append( icon({
                icon: 'upload',
                id: null,
                className: 'file-empty-icon text-muted-foreground size-9 transition duration-200'
            }) )
    ; __line = 10
    ; __append("\n\n            ")
    ; __line = 12
    ;  if(typeof title !== 'undefined' && typeof subtitle !== 'undefined') { 
    ; __append("\n                <div class=\"flex flex-col items-center justify-center gap-2\">\n                    ")
    ; __line = 14
    ;  if(typeof title !== 'undefined') { 
    ; __append("\n                        <div class=\"file-empty-title text-sm font-bold\">")
    ; __line = 15
    ; __append( title )
    ; __append("</div>\n                    ")
    ; __line = 16
    ;  } 
    ; __append("\n\n                    ")
    ; __line = 18
    ;  if(typeof subtitle !== 'undefined') { 
    ; __append("\n                        <div class=\"file-empty-subtitle text-2xs text-muted-foreground\">")
    ; __line = 19
    ; __append(escapeFn( subtitle ))
    ; __append("</div>\n                    ")
    ; __line = 20
    ;  } 
    ; __append("\n                </div>\n            ")
    ; __line = 22
    ;  } else if(typeof title !== 'undefined') { 
    ; __append("\n                <div class=\"file-empty-title text-sm font-bold\">")
    ; __line = 23
    ; __append( title )
    ; __append("</div>\n            ")
    ; __line = 24
    ;  } else if(typeof subtitle !== 'undefined') { 
    ; __append("\n                <div class=\"file-empty-subtitle text-2xs text-muted-foreground\">")
    ; __line = 25
    ; __append(escapeFn( subtitle ))
    ; __append("</div>\n            ")
    ; __line = 26
    ;  } 
    ; __append("\n        </div>\n\n        <img class=\"file-cover rounded-2 w-full h-full transition duration-200 ")
    ; __line = 29
    ;  if(typeof preview !== 'undefined' && preview != null) { 
    ; __append("active")
    ;  } 
    ; __append("\" src=\"")
    ;  if(typeof preview !== 'undefined' && preview != null) { 
    ; __append(escapeFn( preview ))
    ;  } 
    ; __append("\">\n    </div>\n</div>")
    ; __line = 31
  }
  return __output;
} catch (e) {
  rethrow(e, __lines, __filename, __line, escapeFn);
}

}
    return anonymous(edata);
}