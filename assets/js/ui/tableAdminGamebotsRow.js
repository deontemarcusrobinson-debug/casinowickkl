function tableAdminGamebotsRow(edata) {
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
  , __lines = "<div class=\"table-row relative\">\n    <div class=\"table-column text-left\">\n        <%- userField({ user }); %>\n    </div>\n\n    <div class=\"table-column text-left pointer\" data-copy=\"text\" data-text=\"<%= user.userid %>\"><%= user.userid %></div>\n    <div class=\"table-column text-left\">\n        <div class=\"flex flex-row items-center justify-start gap-1\">\n            <%- icon({\n                icon: 'diamond',\n                className: 'text-primary size-4'\n            }); %>\n\n            <span><%= balance %></span>\n        </div>\n    </div>\n    <div class=\"table-column text-left\"><%= created %></div>\n\n    <div class=\"table-column\">\n        <div class=\"flex flex-row items-center justify-end\">\n            <%- overflowMenu({\n                items: [\n                    {\n                        link: true,\n                        destructive: false,\n                        label: 'View profile',\n                        icon: 'eye',\n                        href: '/user/' + user.userid,\n                        attributes: [\n                            { name: 'target', value: '_blank' }\n                        ]\n                    },\n                    {\n                        link: false,\n                        destructive: false,\n                        label: 'Manage bot',\n                        icon: 'pencil',\n                        className: 'admin_gamebot_moderate',\n                        attributes: [\n                            { name: 'data-userid', value: user.userid }\n                        ]\n                    }\n                ]\n            }); %>\n        </div>\n    </div>\n</div>"
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
    ; __append("</div>\n    <div class=\"table-column text-left\">\n        <div class=\"flex flex-row items-center justify-start gap-1\">\n            ")
    ; __line = 9
    ; __append( icon({
                icon: 'diamond',
                className: 'text-primary size-4'
            }) )
    ; __line = 12
    ; __append("\n\n            <span>")
    ; __line = 14
    ; __append(escapeFn( balance ))
    ; __append("</span>\n        </div>\n    </div>\n    <div class=\"table-column text-left\">")
    ; __line = 17
    ; __append(escapeFn( created ))
    ; __append("</div>\n\n    <div class=\"table-column\">\n        <div class=\"flex flex-row items-center justify-end\">\n            ")
    ; __line = 21
    ; __append( overflowMenu({
                items: [
                    {
                        link: true,
                        destructive: false,
                        label: 'View profile',
                        icon: 'eye',
                        href: '/user/' + user.userid,
                        attributes: [
                            { name: 'target', value: '_blank' }
                        ]
                    },
                    {
                        link: false,
                        destructive: false,
                        label: 'Manage bot',
                        icon: 'pencil',
                        className: 'admin_gamebot_moderate',
                        attributes: [
                            { name: 'data-userid', value: user.userid }
                        ]
                    }
                ]
            }) )
    ; __line = 44
    ; __append("\n        </div>\n    </div>\n</div>")
    ; __line = 47
  }
  return __output;
} catch (e) {
  rethrow(e, __lines, __filename, __line, escapeFn);
}

}
    return anonymous(edata);
}