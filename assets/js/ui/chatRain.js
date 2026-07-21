function chatRain(edata) {
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
  , __lines = "<div class=\"chat-rain waiting rounded-2\" id=\"chat_rain\">\n    <div class=\"waiting flex flex-row gap-2 items-center justify-between\">\n        <div class=\"border\"></div>\n\n        <div class=\"flex flex-col gap-2 justify-between\">\n            <div class=\"title\">Live Rain</div>\n            <div class=\"description\"><span id=\"chat_rain_last\">0 minutes ago</span></div>\n            <div class=\"description hidden\" id=\"chat_rain_first\">This is the first rain</div>\n        </div>\n\n        <div class=\"flex flex-row items-center gap-2 bg-secondary rounded-2 p-2\">\n            <div class=\"info flex flex-row items-center justify-center gap-1\">\n                <%- icon({\n                    icon: 'diamond',\n                    className: 'text-primary size-4'\n                }); %>\n\n                <span class=\"amount\">0.00</span>\n            </div>\n\n            <button type=\"button\" class=\"button button-hover button-success shadow-2 flex items-center justify-center\" data-modal=\"show\" data-id=\"#modal_tip_rain\">\n                <%- icon({\n                    icon: 'hand-coins',\n                    className: 'size-4'\n                }); %>\n            </button>\n        </div>\n    </div>\n\n    <div class=\"started flex flex-col gap-2 items-center\">\n        <div class=\"border\"></div>\n\n        <div class=\"info flex flex-row items-center justify-center gap-1\">\n            <%- icon({\n                icon: 'diamond',\n                className: 'text-primary size-6'\n            }); %>\n\n            <span class=\"amount\">0.00</span>\n        </div>\n\n        <div class=\"flex flex-col items-center gap-1\">\n            <div class=\"title\">It's about to Rain!</div>\n            <div class=\"description\">Complete the captcha to join the rain!</div>\n        </div>\n\n        <div class=\"flex flex-row justify-center gap-1\">\n            <button type=\"button\" class=\"button button-hover button-primary shadow-2\" id=\"chat_rain_join\">Join</button>\n            <button type=\"button\" class=\"button button-hover button-primary shadow-2 disabled\" id=\"chat_rain_joined\">Joined</button>\n\n            <button type=\"button\" class=\"button button-hover button-danger shadow-2 flex items-center justify-center\" data-modal=\"show\" data-id=\"#modal_tip_rain\">\n                <%- icon({\n                    icon: 'hand-coins',\n                    className: 'size-4'\n                }); %>\n            </button>\n        </div>\n\n        <div class=\"progress\">\n            <div class=\"bar\" id=\"chat_rain_progress\"></div>\n        </div>\n    </div>\n</div>"
  , __filename = undefined;
try {
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
  with (locals || {}) {
    ; __append("<div class=\"chat-rain waiting rounded-2\" id=\"chat_rain\">\n    <div class=\"waiting flex flex-row gap-2 items-center justify-between\">\n        <div class=\"border\"></div>\n\n        <div class=\"flex flex-col gap-2 justify-between\">\n            <div class=\"title\">Live Rain</div>\n            <div class=\"description\"><span id=\"chat_rain_last\">0 minutes ago</span></div>\n            <div class=\"description hidden\" id=\"chat_rain_first\">This is the first rain</div>\n        </div>\n\n        <div class=\"flex flex-row items-center gap-2 bg-secondary rounded-2 p-2\">\n            <div class=\"info flex flex-row items-center justify-center gap-1\">\n                ")
    ; __line = 13
    ; __append( icon({
                    icon: 'diamond',
                    className: 'text-primary size-4'
                }) )
    ; __line = 16
    ; __append("\n\n                <span class=\"amount\">0.00</span>\n            </div>\n\n            <button type=\"button\" class=\"button button-hover button-success shadow-2 flex items-center justify-center\" data-modal=\"show\" data-id=\"#modal_tip_rain\">\n                ")
    ; __line = 22
    ; __append( icon({
                    icon: 'hand-coins',
                    className: 'size-4'
                }) )
    ; __line = 25
    ; __append("\n            </button>\n        </div>\n    </div>\n\n    <div class=\"started flex flex-col gap-2 items-center\">\n        <div class=\"border\"></div>\n\n        <div class=\"info flex flex-row items-center justify-center gap-1\">\n            ")
    ; __line = 34
    ; __append( icon({
                icon: 'diamond',
                className: 'text-primary size-6'
            }) )
    ; __line = 37
    ; __append("\n\n            <span class=\"amount\">0.00</span>\n        </div>\n\n        <div class=\"flex flex-col items-center gap-1\">\n            <div class=\"title\">It's about to Rain!</div>\n            <div class=\"description\">Complete the captcha to join the rain!</div>\n        </div>\n\n        <div class=\"flex flex-row justify-center gap-1\">\n            <button type=\"button\" class=\"button button-hover button-primary shadow-2\" id=\"chat_rain_join\">Join</button>\n            <button type=\"button\" class=\"button button-hover button-primary shadow-2 disabled\" id=\"chat_rain_joined\">Joined</button>\n\n            <button type=\"button\" class=\"button button-hover button-danger shadow-2 flex items-center justify-center\" data-modal=\"show\" data-id=\"#modal_tip_rain\">\n                ")
    ; __line = 52
    ; __append( icon({
                    icon: 'hand-coins',
                    className: 'size-4'
                }) )
    ; __line = 55
    ; __append("\n            </button>\n        </div>\n\n        <div class=\"progress\">\n            <div class=\"bar\" id=\"chat_rain_progress\"></div>\n        </div>\n    </div>\n</div>")
    ; __line = 63
  }
  return __output;
} catch (e) {
  rethrow(e, __lines, __filename, __line, escapeFn);
}

}
    return anonymous(edata);
}