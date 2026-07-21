function tableSupportRequestsRow(edata) {
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
  , __lines = "<div class=\"table-row\">\n    <div class=\"table-column text-left\">\n        <a class=\"underline\" href=\"/support/requests/<%= id %>\"><%= subject %></a>\n    </div>\n    <div class=\"table-column text-left\"><%= { 0: 'General / Others', 1: 'Bug report', 2: 'Trade offer issue', 3: 'Improvements / Ideas', 4: 'Marketing / Partnership', 5: 'Ranking up' }[department] %></div>\n    <div class=\"table-column text-left\"><%= created %></div>\n    <div class=\"table-column text-left\"><%= updated %></div>\n    <div class=\"table-column\">\n        <div class=\"flex flex-row justify-end\">\n            <div class=\"<%= [ { 0: 'bg-success bg-opacity-50', 1: 'bg-success bg-opacity-50', 2: 'bg-warning bg-opacity-50' }[status], 'bg-info bg-opacity-50' ][closed] %> p-1 rounded-1\"><%= [ { 0: 'Opened', 1: 'Opened', 2: 'Awaiting your reply' }[status], 'Solved' ][closed] %></div>\n        </div>\n    </div>\n</div>"
  , __filename = undefined;
try {
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
  with (locals || {}) {
    ; __append("<div class=\"table-row\">\n    <div class=\"table-column text-left\">\n        <a class=\"underline\" href=\"/support/requests/")
    ; __line = 3
    ; __append(escapeFn( id ))
    ; __append("\">")
    ; __append(escapeFn( subject ))
    ; __append("</a>\n    </div>\n    <div class=\"table-column text-left\">")
    ; __line = 5
    ; __append(escapeFn( { 0: 'General / Others', 1: 'Bug report', 2: 'Trade offer issue', 3: 'Improvements / Ideas', 4: 'Marketing / Partnership', 5: 'Ranking up' }[department] ))
    ; __append("</div>\n    <div class=\"table-column text-left\">")
    ; __line = 6
    ; __append(escapeFn( created ))
    ; __append("</div>\n    <div class=\"table-column text-left\">")
    ; __line = 7
    ; __append(escapeFn( updated ))
    ; __append("</div>\n    <div class=\"table-column\">\n        <div class=\"flex flex-row justify-end\">\n            <div class=\"")
    ; __line = 10
    ; __append(escapeFn( [ { 0: 'bg-success bg-opacity-50', 1: 'bg-success bg-opacity-50', 2: 'bg-warning bg-opacity-50' }[status], 'bg-info bg-opacity-50' ][closed] ))
    ; __append(" p-1 rounded-1\">")
    ; __append(escapeFn( [ { 0: 'Opened', 1: 'Opened', 2: 'Awaiting your reply' }[status], 'Solved' ][closed] ))
    ; __append("</div>\n        </div>\n    </div>\n</div>")
    ; __line = 13
  }
  return __output;
} catch (e) {
  rethrow(e, __lines, __filename, __line, escapeFn);
}

}
    return anonymous(edata);
}