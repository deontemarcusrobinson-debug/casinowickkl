function coinflipPlayer(edata) {
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
  , __lines = "<div class=\"coinflip-player <% if(!winner) { %>active<% } %> w-5/12 h-full bg-secondary rounded-2 p-1\">\n    <div class=\"flex flex-col justify-between items-center h-full\">\n        <div class=\"flex flex-col items-center justify-center size-full gap-2\">\n            <% if(user){ %>\n                <%- userAvatar({ user, size: 'size-15', features: [\n                    '<img class=\"sop sop-left border-1 border-secondary rounded-full\" src=\"/img/coinflip/coin' + position + '.png\">'\n                ] }); %>\n\n                <div class=\"text-center w-full truncate\"><%= user.name %></div>\n            <% } else if(joined) { %>\n                <% if(creator) { %>\n                    <button class=\"coinflip-callbot button button-hover button-primary shadow-2\" data-id=\"<%= id %>\">Call a Bot</button>\n                <% } %>\n            <% } else { %>\n                <button class=\"coinflip-join button button-hover button-primary shadow-2\" data-id=\"<%= id %>\">Join Game</button>\n            <% } %>\n        </div>\n\n        <div class=\"bg-card rounded-1 border-2 border-card px-2 flex flex-row items-center justify-center gap-1\">\n            <%- icon({\n                icon: 'diamond',\n                id: null,\n                className: 'text-primary size-4'\n            }); %>\n\n            <span class=\"text-base\"><%= amount %></span>\n        </div>\n    </div>\n</div>"
  , __filename = undefined;
try {
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
  with (locals || {}) {
    ; __append("<div class=\"coinflip-player ")
    ;  if(!winner) { 
    ; __append("active")
    ;  } 
    ; __append(" w-5/12 h-full bg-secondary rounded-2 p-1\">\n    <div class=\"flex flex-col justify-between items-center h-full\">\n        <div class=\"flex flex-col items-center justify-center size-full gap-2\">\n            ")
    ; __line = 4
    ;  if(user){ 
    ; __append("\n                ")
    ; __line = 5
    ; __append( userAvatar({ user, size: 'size-15', features: [
                    '<img class="sop sop-left border-1 border-secondary rounded-full" src="/img/coinflip/coin' + position + '.png">'
                ] }) )
    ; __line = 7
    ; __append("\n\n                <div class=\"text-center w-full truncate\">")
    ; __line = 9
    ; __append(escapeFn( user.name ))
    ; __append("</div>\n            ")
    ; __line = 10
    ;  } else if(joined) { 
    ; __append("\n                ")
    ; __line = 11
    ;  if(creator) { 
    ; __append("\n                    <button class=\"coinflip-callbot button button-hover button-primary shadow-2\" data-id=\"")
    ; __line = 12
    ; __append(escapeFn( id ))
    ; __append("\">Call a Bot</button>\n                ")
    ; __line = 13
    ;  } 
    ; __append("\n            ")
    ; __line = 14
    ;  } else { 
    ; __append("\n                <button class=\"coinflip-join button button-hover button-primary shadow-2\" data-id=\"")
    ; __line = 15
    ; __append(escapeFn( id ))
    ; __append("\">Join Game</button>\n            ")
    ; __line = 16
    ;  } 
    ; __append("\n        </div>\n\n        <div class=\"bg-card rounded-1 border-2 border-card px-2 flex flex-row items-center justify-center gap-1\">\n            ")
    ; __line = 20
    ; __append( icon({
                icon: 'diamond',
                id: null,
                className: 'text-primary size-4'
            }) )
    ; __line = 24
    ; __append("\n\n            <span class=\"text-base\">")
    ; __line = 26
    ; __append(escapeFn( amount ))
    ; __append("</span>\n        </div>\n    </div>\n</div>")
    ; __line = 29
  }
  return __output;
} catch (e) {
  rethrow(e, __lines, __filename, __line, escapeFn);
}

}
    return anonymous(edata);
}