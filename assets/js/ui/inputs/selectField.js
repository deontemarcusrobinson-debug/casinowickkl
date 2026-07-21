function inputsSelectField(edata) {
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
  , __lines = "<div class=\"select-field <%= type %> flex flex-col w-full <% if(typeof disabled !== 'undefined' && disabled) { %>disabled<% } %>\">\n    <div class=\"select-wrapper flex flex-row items-center px-2 rounded-2 w-full transition duration-200 relative\">\n        <div class=\"flex flex-1 flex-row items-center relative\">\n            <% if(typeof label !== 'undefined'){ %>\n                <div class=\"select-label-wrapper flex flex-row items-center gap-1 bg-card text-sm px-2 py-1 rounded-1 transition duration-200\">\n                    <% if(typeof labelIcon !== 'undefined'){ %><%- labelIcon %><% } %>\n\n                    <div class=\"select-label truncate\"><%= label %></div>\n                </div>\n            <% } %>\n\n            <div class=\"select-trigger flex flex-row items-center gap-2 w-full\">\n                <div class=\"select-value w-full truncate\"><% if(typeof items !== 'undefined' && Array.isArray(items)){ %><% if(typeof selected !== 'undefined' && selected != null && selected >= 0 && selected < items.length){ %><%- items[selected].name %><% } else { %><%- items[0].name %><% } %><% } %></div>\n\n                <%- icon({\n                    icon: 'chevron-down',\n                    id: null,\n                    className: 'select-chevron size-2.5 transition duration-200'\n                }); %>\n\n                <input type=\"text\" class=\"select-element w-full h-full <% if(typeof className !== 'undefined' && className != null){ %><%= className %><% } %>\" <% if(typeof id !== 'undefined' && id != null) { %>id=\"<%= id %>\"<% } %> <% if(typeof attributes !== 'undefined' && Array.isArray(attributes)){ %><%- attributes.map(a => a.name + '=\"' + a.value.toString().replace(/\"/g, '&quot;') + '\"').join(' ') %><% } %> value=\"<% if(typeof items !== 'undefined' && Array.isArray(items)){ %><% if(typeof selected !== 'undefined' && selected != null && selected >= 0 && selected < items.length){ %><%- items[selected].value %><% } else { %><%- items[0].value %><% } %><% } %>\" readonly required>\n            </div>\n        </div>\n\n        <% if(typeof items !== 'undefined' && Array.isArray(items)){ %>\n            <div class=\"select-options flex flex-col rounded-2 transition duration-200\">\n                <% items.forEach(function(item){ %>\n                    <div class=\"select-option flex flex-row items-center gap-2 px-2 <% if(typeof selected !== 'undefined' && selected != null && selected >= 0 && selected < items.length && items[selected] == item.value || items[0].value == item.value){ %>focus active<% } %>\" value=\"<%= item.value %>\">\n                        <div class=\"select-option-content truncate w-full\"><%- item.name %></div>\n\n                        <%- icon({\n                            icon: 'check',\n                            id: null,\n                            className: 'select-option-checked size-2.5'\n                        }); %>\n                    </div>\n                <% }); %>\n            </div>\n        <% } %>\n    </div>\n\n    <div class=\"select-subscript px-1\">\n        <% if(typeof errors !== 'undefined' && Array.isArray(errors)){ %>\n            <% if(errors.includes('required')) { %><div class=\"error text-danger text-xs\" data-error=\"required\">This field is required</div><% } %>\n        <% } %>\n    </div>\n</div>"
  , __filename = undefined;
try {
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
  with (locals || {}) {
    ; __append("<div class=\"select-field ")
    ; __append(escapeFn( type ))
    ; __append(" flex flex-col w-full ")
    ;  if(typeof disabled !== 'undefined' && disabled) { 
    ; __append("disabled")
    ;  } 
    ; __append("\">\n    <div class=\"select-wrapper flex flex-row items-center px-2 rounded-2 w-full transition duration-200 relative\">\n        <div class=\"flex flex-1 flex-row items-center relative\">\n            ")
    ; __line = 4
    ;  if(typeof label !== 'undefined'){ 
    ; __append("\n                <div class=\"select-label-wrapper flex flex-row items-center gap-1 bg-card text-sm px-2 py-1 rounded-1 transition duration-200\">\n                    ")
    ; __line = 6
    ;  if(typeof labelIcon !== 'undefined'){ 
    ; __append( labelIcon )
    ;  } 
    ; __append("\n\n                    <div class=\"select-label truncate\">")
    ; __line = 8
    ; __append(escapeFn( label ))
    ; __append("</div>\n                </div>\n            ")
    ; __line = 10
    ;  } 
    ; __append("\n\n            <div class=\"select-trigger flex flex-row items-center gap-2 w-full\">\n                <div class=\"select-value w-full truncate\">")
    ; __line = 13
    ;  if(typeof items !== 'undefined' && Array.isArray(items)){ 
    ;  if(typeof selected !== 'undefined' && selected != null && selected >= 0 && selected < items.length){ 
    ; __append( items[selected].name )
    ;  } else { 
    ; __append( items[0].name )
    ;  } 
    ;  } 
    ; __append("</div>\n\n                ")
    ; __line = 15
    ; __append( icon({
                    icon: 'chevron-down',
                    id: null,
                    className: 'select-chevron size-2.5 transition duration-200'
                }) )
    ; __line = 19
    ; __append("\n\n                <input type=\"text\" class=\"select-element w-full h-full ")
    ; __line = 21
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
    ; __append(" value=\"")
    ;  if(typeof items !== 'undefined' && Array.isArray(items)){ 
    ;  if(typeof selected !== 'undefined' && selected != null && selected >= 0 && selected < items.length){ 
    ; __append( items[selected].value )
    ;  } else { 
    ; __append( items[0].value )
    ;  } 
    ;  } 
    ; __append("\" readonly required>\n            </div>\n        </div>\n\n        ")
    ; __line = 25
    ;  if(typeof items !== 'undefined' && Array.isArray(items)){ 
    ; __append("\n            <div class=\"select-options flex flex-col rounded-2 transition duration-200\">\n                ")
    ; __line = 27
    ;  items.forEach(function(item){ 
    ; __append("\n                    <div class=\"select-option flex flex-row items-center gap-2 px-2 ")
    ; __line = 28
    ;  if(typeof selected !== 'undefined' && selected != null && selected >= 0 && selected < items.length && items[selected] == item.value || items[0].value == item.value){ 
    ; __append("focus active")
    ;  } 
    ; __append("\" value=\"")
    ; __append(escapeFn( item.value ))
    ; __append("\">\n                        <div class=\"select-option-content truncate w-full\">")
    ; __line = 29
    ; __append( item.name )
    ; __append("</div>\n\n                        ")
    ; __line = 31
    ; __append( icon({
                            icon: 'check',
                            id: null,
                            className: 'select-option-checked size-2.5'
                        }) )
    ; __line = 35
    ; __append("\n                    </div>\n                ")
    ; __line = 37
    ;  }); 
    ; __append("\n            </div>\n        ")
    ; __line = 39
    ;  } 
    ; __append("\n    </div>\n\n    <div class=\"select-subscript px-1\">\n        ")
    ; __line = 43
    ;  if(typeof errors !== 'undefined' && Array.isArray(errors)){ 
    ; __append("\n            ")
    ; __line = 44
    ;  if(errors.includes('required')) { 
    ; __append("<div class=\"error text-danger text-xs\" data-error=\"required\">This field is required</div>")
    ;  } 
    ; __append("\n        ")
    ; __line = 45
    ;  } 
    ; __append("\n    </div>\n</div>")
    ; __line = 47
  }
  return __output;
} catch (e) {
  rethrow(e, __lines, __filename, __line, escapeFn);
}

}
    return anonymous(edata);
}