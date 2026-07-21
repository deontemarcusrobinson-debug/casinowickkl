function rouletteSpinner(edata) {
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
  , __lines = "<div class=\"roulette-case flex flex-row items-center rounded-2 relative\" id=\"roulette_case\">\n    <div class=\"group-reel flex\" id=\"roulette_spinner\">\n        <% for(var i = 0; i <= 7; i++) { %>\n            <div class=\"flex flex-row items-center\">\n                <div class=\"reel-item red flex row items-center transition duration-200\">\n                    <div class=\"reel-content shadow-2 flex justify-center items-center\">\n                        <%- icon({\n                            icon: 'counter-terrorist',\n                            className: 'opacity-70 text-foreground h-8/12 w-full'\n                        }); %>\n                    </div>\n                </div>\n\n                <div class=\"reel-item black flex row items-center transition duration-200\">\n                    <div class=\"reel-content shadow-2 flex justify-center items-center\">\n                        <%- icon({\n                            icon: 'terrorist',\n                            className: 'opacity-70 text-foreground h-8/12 w-full'\n                        }); %>\n                    </div>\n                </div>\n\n                <div class=\"reel-item red flex row items-center transition duration-200\">\n                    <div class=\"reel-content shadow-2 flex justify-center items-center\">\n                        <%- icon({\n                            icon: 'counter-terrorist',\n                            className: 'opacity-70 text-foreground h-8/12 w-full'\n                        }); %>\n                    </div>\n                </div>\n\n                <div class=\"reel-item black flex row items-center transition duration-200\">\n                    <div class=\"reel-content shadow-2 flex justify-center items-center\">\n                        <%- icon({\n                            icon: 'terrorist',\n                            className: 'opacity-70 text-foreground h-8/12 w-full'\n                        }); %>\n                    </div>\n                </div>\n\n                <div class=\"reel-item red flex row items-center transition duration-200\">\n                    <div class=\"reel-content shadow-2 flex justify-center items-center\">\n                        <%- icon({\n                            icon: 'counter-terrorist',\n                            className: 'opacity-70 text-foreground h-8/12 w-full'\n                        }); %>\n                    </div>\n                </div>\n\n                <div class=\"reel-item black flex row items-center transition duration-200\">\n                    <div class=\"reel-content shadow-2 flex justify-center items-center\">\n                        <%- icon({\n                            icon: 'terrorist',\n                            className: 'opacity-70 text-foreground h-8/12 w-full'\n                        }); %>\n                    </div>\n                </div>\n\n                <div class=\"reel-item red bait flex row items-center transition duration-200\">\n                    <div class=\"reel-content shadow-2 flex justify-center items-center\">\n                        <%- icon({\n                            icon: 'flashbang',\n                            className: 'opacity-70 text-foreground h-8/12 w-full'\n                        }); %>\n                    </div>\n                </div>\n\n                <div class=\"reel-item green flex row items-center transition duration-200\">\n                    <div class=\"reel-content shadow-2 flex justify-center items-center\">\n                        <%- icon({\n                            icon: 'hat',\n                            className: 'opacity-70 text-foreground h-8/12 w-full'\n                        }); %>\n                    </div>\n                </div>\n\n                <div class=\"reel-item black bait flex row items-center transition duration-200\">\n                    <div class=\"reel-content shadow-2 flex justify-center items-center\">\n                        <%- icon({\n                            icon: 'flashbang',\n                            className: 'opacity-70 text-foreground h-8/12 w-full'\n                        }); %>\n                    </div>\n                </div>\n\n                <div class=\"reel-item red flex row items-center transition duration-200\">\n                    <div class=\"reel-content shadow-2 flex justify-center items-center\">\n                        <%- icon({\n                            icon: 'counter-terrorist',\n                            className: 'opacity-70 text-foreground h-8/12 w-full'\n                        }); %>\n                    </div>\n                </div>\n\n                <div class=\"reel-item black flex row items-center transition duration-200\">\n                    <div class=\"reel-content shadow-2 flex justify-center items-center\">\n                        <%- icon({\n                            icon: 'terrorist',\n                            className: 'opacity-70 text-foreground h-8/12 w-full'\n                        }); %>\n                    </div>\n                </div>\n\n                <div class=\"reel-item red flex row items-center transition duration-200\">\n                    <div class=\"reel-content shadow-2 flex justify-center items-center\">\n                        <%- icon({\n                            icon: 'counter-terrorist',\n                            className: 'opacity-70 text-foreground h-8/12 w-full'\n                        }); %>\n                    </div>\n                </div>\n\n                <div class=\"reel-item black flex row items-center transition duration-200\">\n                    <div class=\"reel-content shadow-2 flex justify-center items-center\">\n                        <%- icon({\n                            icon: 'terrorist',\n                            className: 'opacity-70 text-foreground h-8/12 w-full'\n                        }); %>\n                    </div>\n                </div>\n\n                <div class=\"reel-item red flex row items-center transition duration-200\">\n                    <div class=\"reel-content shadow-2 flex justify-center items-center\">\n                        <%- icon({\n                            icon: 'counter-terrorist',\n                            className: 'opacity-70 text-foreground h-8/12 w-full'\n                        }); %>\n                    </div>\n                </div>\n\n                <div class=\"reel-item black flex row items-center transition duration-200\">\n                    <div class=\"reel-content shadow-2 flex justify-center items-center\">\n                        <%- icon({\n                            icon: 'terrorist',\n                            className: 'opacity-70 text-foreground h-8/12 w-full'\n                        }); %>\n                    </div>\n                </div>\n            </div>\n        <% } %>\n    </div>\n\n    <div class=\"shadow horizontally shadow-left\"></div>\n    <div class=\"shadow horizontally shadow-right\"></div>\n\n    <div class=\"absolute top-0 bottom-0 left-0 right-0 flex justify-center\">\n        <div class=\"pointer\"></div>\n    </div>\n</div>"
  , __filename = undefined;
try {
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
  with (locals || {}) {
    ; __append("<div class=\"roulette-case flex flex-row items-center rounded-2 relative\" id=\"roulette_case\">\n    <div class=\"group-reel flex\" id=\"roulette_spinner\">\n        ")
    ; __line = 3
    ;  for(var i = 0; i <= 7; i++) { 
    ; __append("\n            <div class=\"flex flex-row items-center\">\n                <div class=\"reel-item red flex row items-center transition duration-200\">\n                    <div class=\"reel-content shadow-2 flex justify-center items-center\">\n                        ")
    ; __line = 7
    ; __append( icon({
                            icon: 'counter-terrorist',
                            className: 'opacity-70 text-foreground h-8/12 w-full'
                        }) )
    ; __line = 10
    ; __append("\n                    </div>\n                </div>\n\n                <div class=\"reel-item black flex row items-center transition duration-200\">\n                    <div class=\"reel-content shadow-2 flex justify-center items-center\">\n                        ")
    ; __line = 16
    ; __append( icon({
                            icon: 'terrorist',
                            className: 'opacity-70 text-foreground h-8/12 w-full'
                        }) )
    ; __line = 19
    ; __append("\n                    </div>\n                </div>\n\n                <div class=\"reel-item red flex row items-center transition duration-200\">\n                    <div class=\"reel-content shadow-2 flex justify-center items-center\">\n                        ")
    ; __line = 25
    ; __append( icon({
                            icon: 'counter-terrorist',
                            className: 'opacity-70 text-foreground h-8/12 w-full'
                        }) )
    ; __line = 28
    ; __append("\n                    </div>\n                </div>\n\n                <div class=\"reel-item black flex row items-center transition duration-200\">\n                    <div class=\"reel-content shadow-2 flex justify-center items-center\">\n                        ")
    ; __line = 34
    ; __append( icon({
                            icon: 'terrorist',
                            className: 'opacity-70 text-foreground h-8/12 w-full'
                        }) )
    ; __line = 37
    ; __append("\n                    </div>\n                </div>\n\n                <div class=\"reel-item red flex row items-center transition duration-200\">\n                    <div class=\"reel-content shadow-2 flex justify-center items-center\">\n                        ")
    ; __line = 43
    ; __append( icon({
                            icon: 'counter-terrorist',
                            className: 'opacity-70 text-foreground h-8/12 w-full'
                        }) )
    ; __line = 46
    ; __append("\n                    </div>\n                </div>\n\n                <div class=\"reel-item black flex row items-center transition duration-200\">\n                    <div class=\"reel-content shadow-2 flex justify-center items-center\">\n                        ")
    ; __line = 52
    ; __append( icon({
                            icon: 'terrorist',
                            className: 'opacity-70 text-foreground h-8/12 w-full'
                        }) )
    ; __line = 55
    ; __append("\n                    </div>\n                </div>\n\n                <div class=\"reel-item red bait flex row items-center transition duration-200\">\n                    <div class=\"reel-content shadow-2 flex justify-center items-center\">\n                        ")
    ; __line = 61
    ; __append( icon({
                            icon: 'flashbang',
                            className: 'opacity-70 text-foreground h-8/12 w-full'
                        }) )
    ; __line = 64
    ; __append("\n                    </div>\n                </div>\n\n                <div class=\"reel-item green flex row items-center transition duration-200\">\n                    <div class=\"reel-content shadow-2 flex justify-center items-center\">\n                        ")
    ; __line = 70
    ; __append( icon({
                            icon: 'hat',
                            className: 'opacity-70 text-foreground h-8/12 w-full'
                        }) )
    ; __line = 73
    ; __append("\n                    </div>\n                </div>\n\n                <div class=\"reel-item black bait flex row items-center transition duration-200\">\n                    <div class=\"reel-content shadow-2 flex justify-center items-center\">\n                        ")
    ; __line = 79
    ; __append( icon({
                            icon: 'flashbang',
                            className: 'opacity-70 text-foreground h-8/12 w-full'
                        }) )
    ; __line = 82
    ; __append("\n                    </div>\n                </div>\n\n                <div class=\"reel-item red flex row items-center transition duration-200\">\n                    <div class=\"reel-content shadow-2 flex justify-center items-center\">\n                        ")
    ; __line = 88
    ; __append( icon({
                            icon: 'counter-terrorist',
                            className: 'opacity-70 text-foreground h-8/12 w-full'
                        }) )
    ; __line = 91
    ; __append("\n                    </div>\n                </div>\n\n                <div class=\"reel-item black flex row items-center transition duration-200\">\n                    <div class=\"reel-content shadow-2 flex justify-center items-center\">\n                        ")
    ; __line = 97
    ; __append( icon({
                            icon: 'terrorist',
                            className: 'opacity-70 text-foreground h-8/12 w-full'
                        }) )
    ; __line = 100
    ; __append("\n                    </div>\n                </div>\n\n                <div class=\"reel-item red flex row items-center transition duration-200\">\n                    <div class=\"reel-content shadow-2 flex justify-center items-center\">\n                        ")
    ; __line = 106
    ; __append( icon({
                            icon: 'counter-terrorist',
                            className: 'opacity-70 text-foreground h-8/12 w-full'
                        }) )
    ; __line = 109
    ; __append("\n                    </div>\n                </div>\n\n                <div class=\"reel-item black flex row items-center transition duration-200\">\n                    <div class=\"reel-content shadow-2 flex justify-center items-center\">\n                        ")
    ; __line = 115
    ; __append( icon({
                            icon: 'terrorist',
                            className: 'opacity-70 text-foreground h-8/12 w-full'
                        }) )
    ; __line = 118
    ; __append("\n                    </div>\n                </div>\n\n                <div class=\"reel-item red flex row items-center transition duration-200\">\n                    <div class=\"reel-content shadow-2 flex justify-center items-center\">\n                        ")
    ; __line = 124
    ; __append( icon({
                            icon: 'counter-terrorist',
                            className: 'opacity-70 text-foreground h-8/12 w-full'
                        }) )
    ; __line = 127
    ; __append("\n                    </div>\n                </div>\n\n                <div class=\"reel-item black flex row items-center transition duration-200\">\n                    <div class=\"reel-content shadow-2 flex justify-center items-center\">\n                        ")
    ; __line = 133
    ; __append( icon({
                            icon: 'terrorist',
                            className: 'opacity-70 text-foreground h-8/12 w-full'
                        }) )
    ; __line = 136
    ; __append("\n                    </div>\n                </div>\n            </div>\n        ")
    ; __line = 140
    ;  } 
    ; __append("\n    </div>\n\n    <div class=\"shadow horizontally shadow-left\"></div>\n    <div class=\"shadow horizontally shadow-right\"></div>\n\n    <div class=\"absolute top-0 bottom-0 left-0 right-0 flex justify-center\">\n        <div class=\"pointer\"></div>\n    </div>\n</div>")
    ; __line = 149
  }
  return __output;
} catch (e) {
  rethrow(e, __lines, __filename, __line, escapeFn);
}

}
    return anonymous(edata);
}