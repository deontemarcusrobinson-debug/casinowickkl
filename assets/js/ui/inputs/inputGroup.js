function inputsInputGroup(edata) {
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
  , __lines = "<div class=\"input-group flex flex-col w-full <% if(typeof disabled !== 'undefined' && disabled) { %>disabled<% } %>\">\n    <div class=\"input-wrapper flex flex-row px-2 rounded-2 w-full transition duration-200\">\n        <div class=\"flex flex-1 flex-row items-center relative\">\n            <% if(typeof label !== 'undefined'){ %>\n                <div class=\"input-label-wrapper w-full\">\n                    <div class=\"input-label flex flex-row items-center gap-2 bg-card text-sm px-2 py-1 rounded-1 transition duration-200\">\n                        <% if(typeof labelIcon !== 'undefined'){ %><%- labelIcon %><% } %>\n\n                        <div class=\"truncate\"><%= label %></div>\n                    </div>\n                </div>\n            <% } %>\n\n            <input <% if(typeof type !== 'undefined'){ %>type=\"<%= type %>\"<% } %> class=\"input-element w-full <% if(typeof className !== 'undefined' && className != null){ %><%= className %><% } %>\" <% if(typeof id !== 'undefined' && id != null) { %>id=\"<%= id %>\"<% } %> <% if(typeof attributes !== 'undefined' && Array.isArray(attributes)){ %><%- attributes.map(a => a.name + '=\"' + a.value.toString().replace(/\"/g, '&quot;') + '\"').join(' ') %><% } %> <% if(typeof value !== 'undefined') { %>value=\"<%= value %>\"<% } %> <% if(typeof label === 'undefined' && typeof placeholder !== 'undefined') { %>placeholder=\"<%= placeholder %>\"<% } %> <% if(typeof readonly !== 'undefined' && readonly) { %>readonly<% } %> required>\n        </div>\n\n        <% if(typeof type !== 'undefined' && type == 'password'){ %>\n            <div class=\"input-addon flex flex-row items-center text-muted-foreground end\">\n                <button type=\"button\" tabindex=\"-1\" class=\"input-password-show button flex flex-row items-center\">\n                    <%- icon({\n                        icon: 'eye',\n                        id: null,\n                        className: 'size-3.5'\n                    }); %>\n                </button>\n\n                <button type=\"button\" tabindex=\"-1\" class=\"input-password-hide button flex flex-row items-center\">\n                    <%- icon({\n                        icon: 'eye-off',\n                        id: null,\n                        className: 'size-3.5'\n                    }); %>\n                </button>\n            </div>\n        <% } %>\n\n        <% if(typeof addons !== 'undefined' && Array.isArray(addons)){ %>\n            <% addons.forEach(function(item){ %>\n                <div class=\"input-addon flex flex-row items-center text-muted-foreground <% if(typeof item.align !== 'undefined' && item.align != null){ %><%= item.align %><% } %>\">\n                    <%- item.addon %>\n                </div>\n            <% }); %>\n        <% } %>\n    </div>\n\n    <div class=\"input-subscript px-1\">\n        <% if(typeof errors !== 'undefined' && Array.isArray(errors)){ %>\n            <% if(errors.includes('required')) { %><div class=\"error text-danger text-xs\" data-error=\"required\">This field is required</div><% } %>\n            <% if(errors.includes('number')) { %><div class=\"error text-danger text-xs\" data-error=\"number\">This field must be a number</div><% } %>\n            <% if(errors.includes('percentage')) { %><div class=\"error text-danger text-xs\" data-error=\"percentage\">This field must be a percentage</div><% } %>\n            <% if(errors.includes('greater')) { %><div class=\"error text-danger text-xs\" data-error=\"greater\">You must enter a greater value</div><% } %>\n            <% if(errors.includes('lesser')) { %><div class=\"error text-danger text-xs\" data-error=\"lesser\">You must enter a lesser value</div><% } %>\n            <% if(errors.includes('positive_integer')) { %><div class=\"error text-danger text-xs\" data-error=\"positive_integer\">This field must be a positive integer number</div><% } %>\n            <% if(errors.includes('minimum_6_characters')) { %><div class=\"error text-danger text-xs\" data-error=\"minimum_6_characters\">This field must be a text with minimum 6 characters</div><% } %>\n            <% if(errors.includes('minimum_10_characters')) { %><div class=\"error text-danger text-xs\" data-error=\"minimum_10_characters\">This field must be a text with minimum 10 characters</div><% } %>\n            <% if(errors.includes('only_letters_numbers')) { %><div class=\"error text-danger text-xs\" data-error=\"only_letters_numbers\">This field must contain only letters and numbers</div><% } %>\n            <% if(errors.includes('password')) { %><div class=\"error text-danger text-xs\" data-error=\"password\">At least 8 characters, maximum 64 characters, one uppercase, one lowercase, one number and one symbol</div><% } %>\n            <% if(errors.includes('email')) { %><div class=\"error text-danger text-xs\" data-error=\"email\">This field must be a email</div><% } %>\n            <% if(errors.includes('name')) { %><div class=\"error text-danger text-xs\" data-error=\"name\">At least 2 characters, maximum 64 characters</div><% } %>\n        <% } %>\n    </div>\n</div>"
  , __filename = undefined;
try {
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
  with (locals || {}) {
    ; __append("<div class=\"input-group flex flex-col w-full ")
    ;  if(typeof disabled !== 'undefined' && disabled) { 
    ; __append("disabled")
    ;  } 
    ; __append("\">\n    <div class=\"input-wrapper flex flex-row px-2 rounded-2 w-full transition duration-200\">\n        <div class=\"flex flex-1 flex-row items-center relative\">\n            ")
    ; __line = 4
    ;  if(typeof label !== 'undefined'){ 
    ; __append("\n                <div class=\"input-label-wrapper w-full\">\n                    <div class=\"input-label flex flex-row items-center gap-2 bg-card text-sm px-2 py-1 rounded-1 transition duration-200\">\n                        ")
    ; __line = 7
    ;  if(typeof labelIcon !== 'undefined'){ 
    ; __append( labelIcon )
    ;  } 
    ; __append("\n\n                        <div class=\"truncate\">")
    ; __line = 9
    ; __append(escapeFn( label ))
    ; __append("</div>\n                    </div>\n                </div>\n            ")
    ; __line = 12
    ;  } 
    ; __append("\n\n            <input ")
    ; __line = 14
    ;  if(typeof type !== 'undefined'){ 
    ; __append("type=\"")
    ; __append(escapeFn( type ))
    ; __append("\"")
    ;  } 
    ; __append(" class=\"input-element w-full ")
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
    ;  if(typeof value !== 'undefined') { 
    ; __append("value=\"")
    ; __append(escapeFn( value ))
    ; __append("\"")
    ;  } 
    ; __append(" ")
    ;  if(typeof label === 'undefined' && typeof placeholder !== 'undefined') { 
    ; __append("placeholder=\"")
    ; __append(escapeFn( placeholder ))
    ; __append("\"")
    ;  } 
    ; __append(" ")
    ;  if(typeof readonly !== 'undefined' && readonly) { 
    ; __append("readonly")
    ;  } 
    ; __append(" required>\n        </div>\n\n        ")
    ; __line = 17
    ;  if(typeof type !== 'undefined' && type == 'password'){ 
    ; __append("\n            <div class=\"input-addon flex flex-row items-center text-muted-foreground end\">\n                <button type=\"button\" tabindex=\"-1\" class=\"input-password-show button flex flex-row items-center\">\n                    ")
    ; __line = 20
    ; __append( icon({
                        icon: 'eye',
                        id: null,
                        className: 'size-3.5'
                    }) )
    ; __line = 24
    ; __append("\n                </button>\n\n                <button type=\"button\" tabindex=\"-1\" class=\"input-password-hide button flex flex-row items-center\">\n                    ")
    ; __line = 28
    ; __append( icon({
                        icon: 'eye-off',
                        id: null,
                        className: 'size-3.5'
                    }) )
    ; __line = 32
    ; __append("\n                </button>\n            </div>\n        ")
    ; __line = 35
    ;  } 
    ; __append("\n\n        ")
    ; __line = 37
    ;  if(typeof addons !== 'undefined' && Array.isArray(addons)){ 
    ; __append("\n            ")
    ; __line = 38
    ;  addons.forEach(function(item){ 
    ; __append("\n                <div class=\"input-addon flex flex-row items-center text-muted-foreground ")
    ; __line = 39
    ;  if(typeof item.align !== 'undefined' && item.align != null){ 
    ; __append(escapeFn( item.align ))
    ;  } 
    ; __append("\">\n                    ")
    ; __line = 40
    ; __append( item.addon )
    ; __append("\n                </div>\n            ")
    ; __line = 42
    ;  }); 
    ; __append("\n        ")
    ; __line = 43
    ;  } 
    ; __append("\n    </div>\n\n    <div class=\"input-subscript px-1\">\n        ")
    ; __line = 47
    ;  if(typeof errors !== 'undefined' && Array.isArray(errors)){ 
    ; __append("\n            ")
    ; __line = 48
    ;  if(errors.includes('required')) { 
    ; __append("<div class=\"error text-danger text-xs\" data-error=\"required\">This field is required</div>")
    ;  } 
    ; __append("\n            ")
    ; __line = 49
    ;  if(errors.includes('number')) { 
    ; __append("<div class=\"error text-danger text-xs\" data-error=\"number\">This field must be a number</div>")
    ;  } 
    ; __append("\n            ")
    ; __line = 50
    ;  if(errors.includes('percentage')) { 
    ; __append("<div class=\"error text-danger text-xs\" data-error=\"percentage\">This field must be a percentage</div>")
    ;  } 
    ; __append("\n            ")
    ; __line = 51
    ;  if(errors.includes('greater')) { 
    ; __append("<div class=\"error text-danger text-xs\" data-error=\"greater\">You must enter a greater value</div>")
    ;  } 
    ; __append("\n            ")
    ; __line = 52
    ;  if(errors.includes('lesser')) { 
    ; __append("<div class=\"error text-danger text-xs\" data-error=\"lesser\">You must enter a lesser value</div>")
    ;  } 
    ; __append("\n            ")
    ; __line = 53
    ;  if(errors.includes('positive_integer')) { 
    ; __append("<div class=\"error text-danger text-xs\" data-error=\"positive_integer\">This field must be a positive integer number</div>")
    ;  } 
    ; __append("\n            ")
    ; __line = 54
    ;  if(errors.includes('minimum_6_characters')) { 
    ; __append("<div class=\"error text-danger text-xs\" data-error=\"minimum_6_characters\">This field must be a text with minimum 6 characters</div>")
    ;  } 
    ; __append("\n            ")
    ; __line = 55
    ;  if(errors.includes('minimum_10_characters')) { 
    ; __append("<div class=\"error text-danger text-xs\" data-error=\"minimum_10_characters\">This field must be a text with minimum 10 characters</div>")
    ;  } 
    ; __append("\n            ")
    ; __line = 56
    ;  if(errors.includes('only_letters_numbers')) { 
    ; __append("<div class=\"error text-danger text-xs\" data-error=\"only_letters_numbers\">This field must contain only letters and numbers</div>")
    ;  } 
    ; __append("\n            ")
    ; __line = 57
    ;  if(errors.includes('password')) { 
    ; __append("<div class=\"error text-danger text-xs\" data-error=\"password\">At least 8 characters, maximum 64 characters, one uppercase, one lowercase, one number and one symbol</div>")
    ;  } 
    ; __append("\n            ")
    ; __line = 58
    ;  if(errors.includes('email')) { 
    ; __append("<div class=\"error text-danger text-xs\" data-error=\"email\">This field must be a email</div>")
    ;  } 
    ; __append("\n            ")
    ; __line = 59
    ;  if(errors.includes('name')) { 
    ; __append("<div class=\"error text-danger text-xs\" data-error=\"name\">At least 2 characters, maximum 64 characters</div>")
    ;  } 
    ; __append("\n        ")
    ; __line = 60
    ;  } 
    ; __append("\n    </div>\n</div>")
    ; __line = 62
  }
  return __output;
} catch (e) {
  rethrow(e, __lines, __filename, __line, escapeFn);
}

}
    return anonymous(edata);
}