function tableAdminTrackingLinksRow(edata) {
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
  , __lines = "<div class=\"table-row relative\">\n    <div class=\"table-column text-left pointer\" data-copy=\"text\" data-text=\"<%= referral %>\"><%= referral %></div>\n    <div class=\"table-column text-left pointer\" data-copy=\"text\" data-text=\"<%= userid %>\"><%= userid %></div>\n    <div class=\"table-column text-left\"><%= name %></div>\n\n    <div class=\"table-column\">\n        <div class=\"flex flex-row items-center justify-end\">\n            <%- overflowMenu({\n                items: [\n                    {\n                        link: false,\n                        destructive: false,\n                        label: 'Copy tracking link',\n                        icon: 'link',\n                        attributes: [\n                            { name: 'data-copy', value: 'text' },\n                            { name: 'data-text', value: link }\n                        ]\n                    },\n                    {\n                        link: false,\n                        destructive: false,\n                        label: 'Statistics',\n                        icon: 'chart',\n                        className: 'admin_tracking_joins_dashboard',\n                        attributes: [\n                            { name: 'data-id', value: id }\n                        ]\n                    },\n                    {\n                        link: false,\n                        destructive: true,\n                        label: 'Remove tracking link',\n                        icon: 'trash',\n                        className: 'admin_tracking_links_remove',\n                        attributes: [\n                            { name: 'data-id', value: id }\n                        ]\n                    }\n                ]\n            }); %>\n        </div>\n    </div>\n</div>"
  , __filename = undefined;
try {
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
  with (locals || {}) {
    ; __append("<div class=\"table-row relative\">\n    <div class=\"table-column text-left pointer\" data-copy=\"text\" data-text=\"")
    ; __line = 2
    ; __append(escapeFn( referral ))
    ; __append("\">")
    ; __append(escapeFn( referral ))
    ; __append("</div>\n    <div class=\"table-column text-left pointer\" data-copy=\"text\" data-text=\"")
    ; __line = 3
    ; __append(escapeFn( userid ))
    ; __append("\">")
    ; __append(escapeFn( userid ))
    ; __append("</div>\n    <div class=\"table-column text-left\">")
    ; __line = 4
    ; __append(escapeFn( name ))
    ; __append("</div>\n\n    <div class=\"table-column\">\n        <div class=\"flex flex-row items-center justify-end\">\n            ")
    ; __line = 8
    ; __append( overflowMenu({
                items: [
                    {
                        link: false,
                        destructive: false,
                        label: 'Copy tracking link',
                        icon: 'link',
                        attributes: [
                            { name: 'data-copy', value: 'text' },
                            { name: 'data-text', value: link }
                        ]
                    },
                    {
                        link: false,
                        destructive: false,
                        label: 'Statistics',
                        icon: 'chart',
                        className: 'admin_tracking_joins_dashboard',
                        attributes: [
                            { name: 'data-id', value: id }
                        ]
                    },
                    {
                        link: false,
                        destructive: true,
                        label: 'Remove tracking link',
                        icon: 'trash',
                        className: 'admin_tracking_links_remove',
                        attributes: [
                            { name: 'data-id', value: id }
                        ]
                    }
                ]
            }) )
    ; __line = 41
    ; __append("\n        </div>\n    </div>\n</div>")
    ; __line = 44
  }
  return __output;
} catch (e) {
  rethrow(e, __lines, __filename, __line, escapeFn);
}

}
    return anonymous(edata);
}