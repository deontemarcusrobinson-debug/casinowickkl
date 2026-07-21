function inputsCalendarField(edata) {
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
  , __lines = "<%\n    function pad(s, n) {\n        return String(s).padStart(n, '0');\n    }\n\n    function toISO(d) {\n        return d.getFullYear() + '-' + pad(d.getMonth() + 1, 2) + '-' + pad(d.getDate(), 2);\n    }\n%>\n\n<div class=\"calendar-field flex flex-row items-center relative w-full <% if(typeof disabled !== 'undefined' && disabled) { %>disabled<% } %>\">\n    <%- inputsCalendarPopoverDays({\n        selected: typeof selected !== 'undefined' && selected != null ? selected : null,\n        timestemp: typeof selected !== 'undefined' && selected != null ? new Date(new Date(selected).getFullYear(), new Date(selected).getMonth(), 1).getTime() : new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime()\n    }); %>\n\n    <input type=\"text\" class=\"calendar-element w-full h-full <% if(typeof className !== 'undefined' && className != null){ %><%= className %><% } %>\" <% if(typeof id !== 'undefined' && id != null) { %>id=\"<%= id %>\"<% } %> <% if(typeof attributes !== 'undefined' && Array.isArray(attributes)){ %><%- attributes.map(a => a.name + '=\"' + a.value.toString().replace(/\"/g, '&quot;') + '\"').join(' ') %><% } %> <% if(typeof selected !== 'undefined' && selected != null) { %>value=\"<%= toISO(new Date(selected)) %>\"<% } %> data-timestemp=\"<%= typeof selected !== 'undefined' && selected != null ? new Date(new Date(selected).getFullYear(), new Date(selected).getMonth(), 1).getTime() : new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime() %>\" disabled>\n</div>"
  , __filename = undefined;
try {
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
  with (locals || {}) {
    ; 
    function pad(s, n) {
        return String(s).padStart(n, '0');
    }

    function toISO(d) {
        return d.getFullYear() + '-' + pad(d.getMonth() + 1, 2) + '-' + pad(d.getDate(), 2);
    }

    ; __line = 9
    ; __append("\n\n<div class=\"calendar-field flex flex-row items-center relative w-full ")
    ; __line = 11
    ;  if(typeof disabled !== 'undefined' && disabled) { 
    ; __append("disabled")
    ;  } 
    ; __append("\">\n    ")
    ; __line = 12
    ; __append( inputsCalendarPopoverDays({
        selected: typeof selected !== 'undefined' && selected != null ? selected : null,
        timestemp: typeof selected !== 'undefined' && selected != null ? new Date(new Date(selected).getFullYear(), new Date(selected).getMonth(), 1).getTime() : new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime()
    }) )
    ; __line = 15
    ; __append("\n\n    <input type=\"text\" class=\"calendar-element w-full h-full ")
    ; __line = 17
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
    ;  if(typeof selected !== 'undefined' && selected != null) { 
    ; __append("value=\"")
    ; __append(escapeFn( toISO(new Date(selected)) ))
    ; __append("\"")
    ;  } 
    ; __append(" data-timestemp=\"")
    ; __append(escapeFn( typeof selected !== 'undefined' && selected != null ? new Date(new Date(selected).getFullYear(), new Date(selected).getMonth(), 1).getTime() : new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime() ))
    ; __append("\" disabled>\n</div>")
    ; __line = 18
  }
  return __output;
} catch (e) {
  rethrow(e, __lines, __filename, __line, escapeFn);
}

}
    return anonymous(edata);
}