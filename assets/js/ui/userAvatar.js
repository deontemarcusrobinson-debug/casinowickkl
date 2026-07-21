function userAvatar(edata) {
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
  , __lines = "<div class=\"avatar-field rounded-full <% if(typeof className !== 'undefined' && className != null){ %><%= className %><% } %> <% if(!user.anonymous){ %><%= [ 'tier-steel', 'tier-bronze', 'tier-silver', 'tier-gold', 'tier-diamond' ][Math.floor(user.level / 25)] %><% } %> relative\">\n    <img class=\"avatar <%= size %> rounded-full\" src=\"<%= user.avatar %>\">\n\n    <% if(!user.anonymous){ %>\n        <div class=\"level sup sup-left flex justify-center items-center border-2 border-secondary rounded-full\"><%= user.level %></div>\n    <% } %>\n\n    <% if(typeof features !== 'undefined' && Array.isArray(features)){ %>\n        <% features.forEach(function(item){ %>\n            <%- item %>\n        <% }); %>\n    <% } %>\n</div>"
  , __filename = undefined;
try {
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
  with (locals || {}) {
    ; __append("<div class=\"avatar-field rounded-full ")
    ;  if(typeof className !== 'undefined' && className != null){ 
    ; __append(escapeFn( className ))
    ;  } 
    ; __append(" ")
    ;  if(!user.anonymous){ 
    ; __append(escapeFn( [ 'tier-steel', 'tier-bronze', 'tier-silver', 'tier-gold', 'tier-diamond' ][Math.floor(user.level / 25)] ))
    ;  } 
    ; __append(" relative\">\n    <img class=\"avatar ")
    ; __line = 2
    ; __append(escapeFn( size ))
    ; __append(" rounded-full\" src=\"")
    ; __append(escapeFn( user.avatar ))
    ; __append("\">\n\n    ")
    ; __line = 4
    ;  if(!user.anonymous){ 
    ; __append("\n        <div class=\"level sup sup-left flex justify-center items-center border-2 border-secondary rounded-full\">")
    ; __line = 5
    ; __append(escapeFn( user.level ))
    ; __append("</div>\n    ")
    ; __line = 6
    ;  } 
    ; __append("\n\n    ")
    ; __line = 8
    ;  if(typeof features !== 'undefined' && Array.isArray(features)){ 
    ; __append("\n        ")
    ; __line = 9
    ;  features.forEach(function(item){ 
    ; __append("\n            ")
    ; __line = 10
    ; __append( item )
    ; __append("\n        ")
    ; __line = 11
    ;  }); 
    ; __append("\n    ")
    ; __line = 12
    ;  } 
    ; __append("\n</div>")
    ; __line = 13
  }
  return __output;
} catch (e) {
  rethrow(e, __lines, __filename, __line, escapeFn);
}

}
    return anonymous(edata);
}