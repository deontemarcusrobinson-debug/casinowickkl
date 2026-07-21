function inputsDatePicker(edata) {
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
  , __lines = "<%\n    function pad(s, n) {\n        return String(s).padStart(n, '0');\n    }\n\n    function toISO(d) {\n        return d.getFullYear() + '-' + pad(d.getMonth() + 1, 2) + '-' + pad(d.getDate(), 2);\n    }\n%>\n\n<div class=\"date-picker flex flex-col w-full <% if(typeof disabled !== 'undefined' && disabled) { %>disabled<% } %>\">\n    <div class=\"date-wrapper flex flex-row items-center px-2 rounded-2 w-full transition duration-200 relative\">\n        <div class=\"date-trigger flex flex-row items-center justify-between gap-2 w-full\">\n            <div class=\"flex flex-1 flex-row items-center relative\">\n                <% if(typeof label !== 'undefined'){ %>\n                    <div class=\"date-label-wrapper flex flex-row items-center gap-1 bg-card text-sm px-2 py-1 rounded-1 transition duration-200\">\n                        <% if(typeof labelIcon !== 'undefined'){ %><%- labelIcon %><% } %>\n\n                        <div class=\"date-label truncate\"><%= label %></div>\n                    </div>\n                <% } %>\n\n                <div class=\"flex flex-1 flex-row items-center\">\n                    <div class=\"date-icon flex flex-row items-center\">\n                        <%- icon({\n                            icon: 'calendar',\n                            id: null,\n                            className: 'size-3.5'\n                        }); %>\n                    </div>\n\n                    <div class=\"date-placeholder w-full truncate\"><% if(typeof selected !== 'undefined' && selected != null){ %><%= [ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ][new Date(selected).getMonth()].slice(0,3) + ' ' + new Date(selected).getDate() + ', ' + new Date(selected).getFullYear() %><% } %></div>\n                </div>\n            </div>\n\n            <%- icon({\n                icon: 'chevron-down',\n                id: null,\n                className: 'date-chevron size-2.5 transition duration-200'\n            }); %>\n        </div>\n\n        <input type=\"text\" class=\"date-element w-full h-full <% if(typeof className !== 'undefined' && className != null){ %><%= className %><% } %>\" <% if(typeof id !== 'undefined' && id != null) { %>id=\"<%= id %>\"<% } %> <% if(typeof attributes !== 'undefined' && Array.isArray(attributes)){ %><%- attributes.map(a => a.name + '=\"' + a.value.toString().replace(/\"/g, '&quot;') + '\"').join(' ') %><% } %> <% if(typeof selected !== 'undefined' && selected != null) { %>value=\"<%= toISO(new Date(selected)) %>\"<% } %>>\n\n        <div class=\"date-calendar transition duration-200 w-min max-md:w-full\">\n            <%- inputsCalendarField({\n                id: null,\n                className: null,\n                attributes: null,\n                disabled: null,\n                selected: typeof selected !== 'undefined' && selected != null ? selected : null\n            }); %>\n        </div>\n    </div>\n\n    <div class=\"date-subscript px-1\">\n        <% if(typeof errors !== 'undefined' && Array.isArray(errors)){ %>\n            <% if(errors.includes('required')) { %><div class=\"error text-danger text-xs\" data-error=\"required\">This field is required</div><% } %>\n        <% } %>\n    </div>\n</div>"
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
    ; __append("\n\n<div class=\"date-picker flex flex-col w-full ")
    ; __line = 11
    ;  if(typeof disabled !== 'undefined' && disabled) { 
    ; __append("disabled")
    ;  } 
    ; __append("\">\n    <div class=\"date-wrapper flex flex-row items-center px-2 rounded-2 w-full transition duration-200 relative\">\n        <div class=\"date-trigger flex flex-row items-center justify-between gap-2 w-full\">\n            <div class=\"flex flex-1 flex-row items-center relative\">\n                ")
    ; __line = 15
    ;  if(typeof label !== 'undefined'){ 
    ; __append("\n                    <div class=\"date-label-wrapper flex flex-row items-center gap-1 bg-card text-sm px-2 py-1 rounded-1 transition duration-200\">\n                        ")
    ; __line = 17
    ;  if(typeof labelIcon !== 'undefined'){ 
    ; __append( labelIcon )
    ;  } 
    ; __append("\n\n                        <div class=\"date-label truncate\">")
    ; __line = 19
    ; __append(escapeFn( label ))
    ; __append("</div>\n                    </div>\n                ")
    ; __line = 21
    ;  } 
    ; __append("\n\n                <div class=\"flex flex-1 flex-row items-center\">\n                    <div class=\"date-icon flex flex-row items-center\">\n                        ")
    ; __line = 25
    ; __append( icon({
                            icon: 'calendar',
                            id: null,
                            className: 'size-3.5'
                        }) )
    ; __line = 29
    ; __append("\n                    </div>\n\n                    <div class=\"date-placeholder w-full truncate\">")
    ; __line = 32
    ;  if(typeof selected !== 'undefined' && selected != null){ 
    ; __append(escapeFn( [ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ][new Date(selected).getMonth()].slice(0,3) + ' ' + new Date(selected).getDate() + ', ' + new Date(selected).getFullYear() ))
    ;  } 
    ; __append("</div>\n                </div>\n            </div>\n\n            ")
    ; __line = 36
    ; __append( icon({
                icon: 'chevron-down',
                id: null,
                className: 'date-chevron size-2.5 transition duration-200'
            }) )
    ; __line = 40
    ; __append("\n        </div>\n\n        <input type=\"text\" class=\"date-element w-full h-full ")
    ; __line = 43
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
    ; __append(">\n\n        <div class=\"date-calendar transition duration-200 w-min max-md:w-full\">\n            ")
    ; __line = 46
    ; __append( inputsCalendarField({
                id: null,
                className: null,
                attributes: null,
                disabled: null,
                selected: typeof selected !== 'undefined' && selected != null ? selected : null
            }) )
    ; __line = 52
    ; __append("\n        </div>\n    </div>\n\n    <div class=\"date-subscript px-1\">\n        ")
    ; __line = 57
    ;  if(typeof errors !== 'undefined' && Array.isArray(errors)){ 
    ; __append("\n            ")
    ; __line = 58
    ;  if(errors.includes('required')) { 
    ; __append("<div class=\"error text-danger text-xs\" data-error=\"required\">This field is required</div>")
    ;  } 
    ; __append("\n        ")
    ; __line = 59
    ;  } 
    ; __append("\n    </div>\n</div>")
    ; __line = 61
  }
  return __output;
} catch (e) {
  rethrow(e, __lines, __filename, __line, escapeFn);
}

}
    return anonymous(edata);
}