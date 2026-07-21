function coinflipBet(edata) {
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
  , __lines = "<div class=\"item bg-card bg-opacity-50 relative size-full flex justify-between p-2\" data-id=\"<%= id %>\">\n    <%- coinflipPlayer({\n        id,\n        user: players.find(a => a.position == 0) ? players.find(a => a.position == 0).user : null,\n        amount: amount,\n        position: 0,\n        winner: status == 4 ? data.winner == 0 : true,\n        joined: joined,\n\t\tcreator: creator\n    }); %>\n\n    <div class=\"flex justify-center items-center relative p-2\">\n        <% if(status == 0) { %>\n            <div class=\"font-bold text-xl\">VS</div>\n        <% } else if(status == 1) { %>\n            <div class=\"border-2 border-secondary bg-secondary rounded-full flex justify-center items-center font-bold p-4 text-xl\">\n                <div class=\"countdown absolute\"><%= data.time %></div>\n            </div>\n        <% } else if(status == 2) { %>\n            <div class=\"font-bold text-xl\">EOS</div>\n        <% } else if(status == 3) { %>\n            <div class=\"flex justify-center items-center relative\">\n                <div class=\"coinflip-coin coinflip-coin-animation-<%= data.winner %>\">\n                    <div class=\"front absolute top-0 bottom-0 left-0 right-0\"></div>\n                    <div class=\"back absolute top-0 bottom-0 left-0 right-0\"></div>\n                </div>\n            </div>\n        <% } else if(status == 4) { %>\n            <div class=\"flex justify-center items-center relative\">\n                <div class=\"coinflip-pick-<%= data.winner %>\"></div>\n            </div>\n        <% } %>\n\n        <div class=\"coinflip-fair text-center pointer absolute bottom-0 text-2xs fair-results\" data-fair=\"<%= JSON.stringify(data.fair) %>\">Provably fair</div>\n    </div>\n\n    <%- coinflipPlayer({\n        id,\n        user: players.find(a => a.position == 1) ? players.find(a => a.position == 1).user : null,\n        amount: amount,\n        position: 1,\n        winner: status == 4 ? data.winner == 1 : true,\n        joined: joined,\n\t\tcreator: creator\n    }); %>\n</div>"
  , __filename = undefined;
try {
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
  with (locals || {}) {
    ; __append("<div class=\"item bg-card bg-opacity-50 relative size-full flex justify-between p-2\" data-id=\"")
    ; __append(escapeFn( id ))
    ; __append("\">\n    ")
    ; __line = 2
    ; __append( coinflipPlayer({
        id,
        user: players.find(a => a.position == 0) ? players.find(a => a.position == 0).user : null,
        amount: amount,
        position: 0,
        winner: status == 4 ? data.winner == 0 : true,
        joined: joined,
		creator: creator
    }) )
    ; __line = 10
    ; __append("\n\n    <div class=\"flex justify-center items-center relative p-2\">\n        ")
    ; __line = 13
    ;  if(status == 0) { 
    ; __append("\n            <div class=\"font-bold text-xl\">VS</div>\n        ")
    ; __line = 15
    ;  } else if(status == 1) { 
    ; __append("\n            <div class=\"border-2 border-secondary bg-secondary rounded-full flex justify-center items-center font-bold p-4 text-xl\">\n                <div class=\"countdown absolute\">")
    ; __line = 17
    ; __append(escapeFn( data.time ))
    ; __append("</div>\n            </div>\n        ")
    ; __line = 19
    ;  } else if(status == 2) { 
    ; __append("\n            <div class=\"font-bold text-xl\">EOS</div>\n        ")
    ; __line = 21
    ;  } else if(status == 3) { 
    ; __append("\n            <div class=\"flex justify-center items-center relative\">\n                <div class=\"coinflip-coin coinflip-coin-animation-")
    ; __line = 23
    ; __append(escapeFn( data.winner ))
    ; __append("\">\n                    <div class=\"front absolute top-0 bottom-0 left-0 right-0\"></div>\n                    <div class=\"back absolute top-0 bottom-0 left-0 right-0\"></div>\n                </div>\n            </div>\n        ")
    ; __line = 28
    ;  } else if(status == 4) { 
    ; __append("\n            <div class=\"flex justify-center items-center relative\">\n                <div class=\"coinflip-pick-")
    ; __line = 30
    ; __append(escapeFn( data.winner ))
    ; __append("\"></div>\n            </div>\n        ")
    ; __line = 32
    ;  } 
    ; __append("\n\n        <div class=\"coinflip-fair text-center pointer absolute bottom-0 text-2xs fair-results\" data-fair=\"")
    ; __line = 34
    ; __append(escapeFn( JSON.stringify(data.fair) ))
    ; __append("\">Provably fair</div>\n    </div>\n\n    ")
    ; __line = 37
    ; __append( coinflipPlayer({
        id,
        user: players.find(a => a.position == 1) ? players.find(a => a.position == 1).user : null,
        amount: amount,
        position: 1,
        winner: status == 4 ? data.winner == 1 : true,
        joined: joined,
		creator: creator
    }) )
    ; __line = 45
    ; __append("\n</div>")
    ; __line = 46
  }
  return __output;
} catch (e) {
  rethrow(e, __lines, __filename, __line, escapeFn);
}

}
    return anonymous(edata);
}