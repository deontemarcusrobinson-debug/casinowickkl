function inputsCheckboxField(edata) {
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
  , __lines = "<label class=\"checkbox-field flex flex-row items-center relative <% if(typeof disabled !== 'undefined' && disabled) { %>disabled<% } %>\">\n    <div class=\"checkbox-track flex flex-row items-center justify-center rounded-1 overflow-h transition duration-200\">\n        <div class=\"checkbox-thumb transition duration-200\">\n            <%- icon({\n                icon: 'check',\n                id: null,\n                className: 'size-3'\n            }); %>\n        </div>\n    </div>\n\n    <input type=\"checkbox\" class=\"checkbox-element w-full h-full <% if(typeof className !== 'undefined' && className != null){ %><%= className %><% } %>\" <% if(typeof id !== 'undefined' && id != null) { %>id=\"<%= id %>\"<% } %> <% if(typeof attributes !== 'undefined' && Array.isArray(attributes)){ %><%- attributes.map(a => a.name + '=\"' + a.value.toString().replace(/\"/g, '&quot;') + '\"').join(' ') %><% } %> <% if(typeof checked !== 'undefined' && checked) { %>checked<% } %>>\n</label>"
  , __filename = undefined;
try {
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
  with (locals || {}) {
    ; __append("<label class=\"checkbox-field flex flex-row items-center relative ")
    ;  if(typeof disabled !== 'undefined' && disabled) { 
    ; __append("disabled")
    ;  } 
    ; __append("\">\n    <div class=\"checkbox-track flex flex-row items-center justify-center rounded-1 overflow-h transition duration-200\">\n        <div class=\"checkbox-thumb transition duration-200\">\n            ")
    ; __line = 4
    ; __append( icon({
                icon: 'check',
                id: null,
                className: 'size-3'
            }) )
    ; __line = 8
    ; __append("\n        </div>\n    </div>\n\n    <input type=\"checkbox\" class=\"checkbox-element w-full h-full ")
    ; __line = 12
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
    ;  if(typeof checked !== 'undefined' && checked) { 
    ; __append("checked")
    ;  } 
    ; __append(">\n</label>")
    ; __line = 13
  }
  return __output;
} catch (e) {
  rethrow(e, __lines, __filename, __line, escapeFn);
}

}
    return anonymous(edata);
}