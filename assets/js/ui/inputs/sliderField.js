function inputsSliderField(edata) {
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
  , __lines = "<div class=\"slider-field flex flex-col gap-2 w-full <% if(typeof disabled !== 'undefined' && disabled) { %>disabled<% } %>\">\n    <div class=\"slider-wrapper flex flex-col items-center gap-3 py-2 relative w-full\">\n        <% if(typeof tooltip !== 'undefined' && tooltip) { %>\n            <div class=\"slider-tooltip-wrapper relative\">\n                <div class=\"slider-tooltip flex flex-row items-center gap-2 text-2xs text-nowrap font-bold px-1 rounded-1\"><% if(typeof value !== 'undefined') { %><%= value %><% } else if(typeof min !== 'undefined') { %><%= min %><% } else { %>0<% } %></div>\n            </div>\n        <% } %>\n\n        <input type=\"range\" class=\"slider-element rounded-full w-full <% if(typeof className !== 'undefined' && className != null){ %><%= className %><% } %>\" <% if(typeof id !== 'undefined' && id != null) { %>id=\"<%= id %>\"<% } %> <% if(typeof attributes !== 'undefined' && Array.isArray(attributes)){ %><%- attributes.map(a => a.name + '=\"' + a.value.toString().replace(/\"/g, '&quot;') + '\"').join(' ') %><% } %> min=\"<% if(typeof min !== 'undefined') { %><%= min %><% } else { %>0<% } %>\" max=\"<% if(typeof max !== 'undefined') { %><%= max %><% } else { %>0<% } %>\" step=\"<% if(typeof step !== 'undefined') { %><%= step %><% } else { %>0.01<% } %>\" value=\"<% if(typeof value !== 'undefined') { %><%= value %><% } else if(typeof min !== 'undefined') { %><%= min %><% } else { %>0<% } %>\">\n    </div>\n\n    <% if(typeof ticks !== 'undefined') { %>\n        <%- inputsSliderTicks({ ticks }); %>\n    <% } %>\n</div>"
  , __filename = undefined;
try {
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
  with (locals || {}) {
    ; __append("<div class=\"slider-field flex flex-col gap-2 w-full ")
    ;  if(typeof disabled !== 'undefined' && disabled) { 
    ; __append("disabled")
    ;  } 
    ; __append("\">\n    <div class=\"slider-wrapper flex flex-col items-center gap-3 py-2 relative w-full\">\n        ")
    ; __line = 3
    ;  if(typeof tooltip !== 'undefined' && tooltip) { 
    ; __append("\n            <div class=\"slider-tooltip-wrapper relative\">\n                <div class=\"slider-tooltip flex flex-row items-center gap-2 text-2xs text-nowrap font-bold px-1 rounded-1\">")
    ; __line = 5
    ;  if(typeof value !== 'undefined') { 
    ; __append(escapeFn( value ))
    ;  } else if(typeof min !== 'undefined') { 
    ; __append(escapeFn( min ))
    ;  } else { 
    ; __append("0")
    ;  } 
    ; __append("</div>\n            </div>\n        ")
    ; __line = 7
    ;  } 
    ; __append("\n\n        <input type=\"range\" class=\"slider-element rounded-full w-full ")
    ; __line = 9
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
    ; __append(" min=\"")
    ;  if(typeof min !== 'undefined') { 
    ; __append(escapeFn( min ))
    ;  } else { 
    ; __append("0")
    ;  } 
    ; __append("\" max=\"")
    ;  if(typeof max !== 'undefined') { 
    ; __append(escapeFn( max ))
    ;  } else { 
    ; __append("0")
    ;  } 
    ; __append("\" step=\"")
    ;  if(typeof step !== 'undefined') { 
    ; __append(escapeFn( step ))
    ;  } else { 
    ; __append("0.01")
    ;  } 
    ; __append("\" value=\"")
    ;  if(typeof value !== 'undefined') { 
    ; __append(escapeFn( value ))
    ;  } else if(typeof min !== 'undefined') { 
    ; __append(escapeFn( min ))
    ;  } else { 
    ; __append("0")
    ;  } 
    ; __append("\">\n    </div>\n\n    ")
    ; __line = 12
    ;  if(typeof ticks !== 'undefined') { 
    ; __append("\n        ")
    ; __line = 13
    ; __append( inputsSliderTicks({ ticks }) )
    ; __append("\n    ")
    ; __line = 14
    ;  } 
    ; __append("\n</div>")
    ; __line = 15
  }
  return __output;
} catch (e) {
  rethrow(e, __lines, __filename, __line, escapeFn);
}

}
    return anonymous(edata);
}