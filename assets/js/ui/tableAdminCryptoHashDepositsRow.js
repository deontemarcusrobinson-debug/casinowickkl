function tableAdminCryptoHashDepositsRow(edata) {
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
  , __lines = "<div class=\"table-row relative\">\n    <div class=\"table-column text-left\">#<%= id %></div>\n\n    <div class=\"table-column text-left\">\n        <%- userField({ user }); %>\n    </div>\n\n    <div class=\"table-column text-left\"><%= amount %></div>\n    <div class=\"table-column text-left uppercase\"><%= currency %></div>\n    <div class=\"table-column text-left\" style=\"max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;\" title=\"<%= tx_hash %>\"><%= tx_hash %></div>\n    <div class=\"table-column text-left\"><%= date %></div>\n\n    <div class=\"table-column\">\n        <div class=\"flex flex-row items-center justify-end\">\n            <%- overflowMenu({\n                items: [\n                    {\n                        link: true,\n                        destructive: false,\n                        label: 'View user',\n                        icon: 'eye',\n                        href: '/admin/users/' + user.userid\n                    },\n                    {\n                        link: false,\n                        destructive: false,\n                        label: 'Approve & credit',\n                        icon: 'check',\n                        className: 'admin_hash_deposit_approve',\n                        attributes: [\n                            { name: 'data-id', value: id }\n                        ]\n                    },\n                    {\n                        link: false,\n                        destructive: true,\n                        label: 'Reject',\n                        icon: 'close',\n                        className: 'admin_hash_deposit_reject',\n                        attributes: [\n                            { name: 'data-id', value: id }\n                        ]\n                    }\n                ]\n            }); %>\n        </div>\n    </div>\n</div>\n"
  , __filename = undefined;
try {
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
  with (locals || {}) {
    ; __append("<div class=\"table-row relative\">\n    <div class=\"table-column text-left\">#")
    ; __line = 2
    ; __append(escapeFn( id ))
    ; __append("</div>\n\n    <div class=\"table-column text-left\">\n        ")
    ; __line = 5
    ; __append( userField({ user }) )
    ; __append("\n    </div>\n\n    <div class=\"table-column text-left\">")
    ; __line = 8
    ; __append(escapeFn( amount ))
    ; __append("</div>\n    <div class=\"table-column text-left uppercase\">")
    ; __line = 9
    ; __append(escapeFn( currency ))
    ; __append("</div>\n    <div class=\"table-column text-left\" style=\"max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;\" title=\"")
    ; __line = 10
    ; __append(escapeFn( tx_hash ))
    ; __append("\">")
    ; __append(escapeFn( tx_hash ))
    ; __append("</div>\n    <div class=\"table-column text-left\">")
    ; __line = 11
    ; __append(escapeFn( date ))
    ; __append("</div>\n\n    <div class=\"table-column\">\n        <div class=\"flex flex-row items-center justify-end\">\n            ")
    ; __line = 15
    ; __append( overflowMenu({
                items: [
                    {
                        link: true,
                        destructive: false,
                        label: 'View user',
                        icon: 'eye',
                        href: '/admin/users/' + user.userid
                    },
                    {
                        link: false,
                        destructive: false,
                        label: 'Approve & credit',
                        icon: 'check',
                        className: 'admin_hash_deposit_approve',
                        attributes: [
                            { name: 'data-id', value: id }
                        ]
                    },
                    {
                        link: false,
                        destructive: true,
                        label: 'Reject',
                        icon: 'close',
                        className: 'admin_hash_deposit_reject',
                        attributes: [
                            { name: 'data-id', value: id }
                        ]
                    }
                ]
            }) )
    ; __line = 45
    ; __append("\n        </div>\n    </div>\n</div>\n")
    ; __line = 49
  }
  return __output;
} catch (e) {
  rethrow(e, __lines, __filename, __line, escapeFn);
}

}
    return anonymous(edata);
}