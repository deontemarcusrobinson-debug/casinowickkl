function tableAdminUsersRow(edata) {
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
  , __lines = "<div class=\"table-row relative\">\n    <div class=\"table-column text-left\">\n        <%- userField({ user }); %>\n    </div>\n\n    <div class=\"table-column text-left pointer\" data-copy=\"text\" data-text=\"<%= user.userid %>\"><%= user.userid %></div>\n\n    <div class=\"table-column text-left\">\n        <div class=\"flex flex-row items-center justify-start gap-1\">\n            <%- icon({\n                icon: 'diamond',\n                className: 'text-primary size-4'\n            }); %>\n\n            <span><%= balance %></span>\n        </div>\n    </div>\n\n    <div class=\"table-column text-left font-bold uppercase chat-link-<%= rank %>\"><%= rank %></div>\n    <div class=\"table-column text-left\"><%= created %></div>\n\n    <div class=\"table-column\">\n        <div class=\"flex flex-row items-center justify-end\">\n            <%- overflowMenu({\n                items: [\n                    {\n                        link: true,\n                        destructive: false,\n                        label: 'Manage user',\n                        icon: 'pencil',\n                        href: '/admin/users/' + user.userid\n                    }\n                ]\n            }); %>\n        </div>\n    </div>\n</div>"
  , __filename = undefined;
try {
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
  with (locals || {}) {
    ; __append("<div class=\"table-row relative\">\n    <div class=\"table-column text-left\">\n        ")
    ; __line = 3
    ; __append( userField({ user }) )
    ; __append("\n    </div>\n\n    <div class=\"table-column text-left pointer\" data-copy=\"text\" data-text=\"")
    ; __line = 6
    ; __append(escapeFn( user.userid ))
    ; __append("\">")
    ; __append(escapeFn( user.userid ))
    ; __append("</div>\n\n    <div class=\"table-column text-left\">\n        <div class=\"flex flex-row items-center justify-start gap-1\">\n            ")
    ; __line = 10
    ; __append( icon({
                icon: 'diamond',
                className: 'text-primary size-4'
            }) )
    ; __line = 13
    ; __append("\n\n            <span>")
    ; __line = 15
    ; __append(escapeFn( balance ))
    ; __append("</span>\n        </div>\n    </div>\n\n    <div class=\"table-column text-left font-bold uppercase chat-link-")
    ; __line = 19
    ; __append(escapeFn( rank ))
    ; __append("\">")
    ; __append(escapeFn( rank ))
    ; __append("</div>\n    <div class=\"table-column text-left\">")
    ; __line = 20
    ; __append(escapeFn( created ))
    ; __append("</div>\n\n    <div class=\"table-column\">\n        <div class=\"flex flex-row items-center justify-end\">\n            ")
    ; __line = 24
    ; __append( overflowMenu({
                items: [
                    {
                        link: true,
                        destructive: false,
                        label: 'Manage user',
                        icon: 'pencil',
                        href: '/admin/users/' + user.userid
                    }
                ]
            }) )
    ; __line = 34
    ; __append("\n        </div>\n    </div>\n</div>")
    ; __line = 37
  }
  return __output;
} catch (e) {
  rethrow(e, __lines, __filename, __line, escapeFn);
}

}
    return anonymous(edata);
}