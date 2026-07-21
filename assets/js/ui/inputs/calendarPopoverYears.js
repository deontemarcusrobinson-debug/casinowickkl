function inputsCalendarPopoverYears(edata) {
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
  , __lines = "<%\n    var viewYear = new Date(timestemp).getFullYear();\n    var viewMonth = new Date(timestemp).getMonth();\n    var viewDay = new Date(timestemp).getDate();\n\n    function pad(s, n) {\n        return String(s).padStart(n, '0');\n    }\n\n    function toISO(d) {\n        return d.getFullYear() + '-' + pad(d.getMonth() + 1, 2) + '-' + pad(d.getDate(), 2);\n    }\n%>\n\n<div class=\"calendar-popover years flex flex-col gap-4 bg-secondary border-2 border-accent rounded-2 p-1 overflow-h transition duration-200 w-full\">\n    <div class=\"calendar-popover-header flex flex-row items-center justify-between gap-2 border-b-2 border-card p-2 w-full\">\n        <div class=\"flex flex-row items-center gap-1\">\n            <button class=\"button flex flex-row items-center justify-center transition duration-200\" data-value=\"<%= toISO(new Date(viewYear - 10, viewMonth, viewDay)) %>\">‹</button>\n        </div>\n\n        <button class=\"calendar-popover-date text-sm text-nowrap font-bold px-2 py-1 rounded-1 pointer transition duration-200\"><%= (Math.floor(viewYear / 10) * 10 + 1) + ' - ' + (Math.floor(viewYear / 10) * 10 + 10) %></button>\n\n        <div class=\"flex flex-row items-center gap-1\">\n            <button class=\"button flex flex-row items-center justify-center transition duration-200\" data-value=\"<%= toISO(new Date(viewYear + 10, viewMonth, viewDay)) %>\">›</button>\n        </div>\n    </div>\n\n    <div class=\"calendar-popover-content px-2 pb-2\">\n        <% Array.from(Array(12), (e, i) => ({\n            name: (Math.floor(viewYear / 10) * 10 + i + 1).toString(),\n            value: toISO(new Date(Math.floor(viewYear / 10) * 10 + i + 1, viewMonth, viewDay)),\n            type: Math.floor(viewYear / 10) * 10 + i + 1 == viewYear ? 'active' : i >= 10 ? 'outside' : null\n        })).forEach(function(item){ %>\n            <button class=\"calendar-popover-option <%= item.type %> flex items-center justify-center text-sm rounded-1 pointer transition duration-200\" value=\"<%= item.value %>\" <% if(item.type == 'outside'){ %>disabled<% } %>><%= item.name %></button>\n        <% }); %>\n    </div>\n</div>"
  , __filename = undefined;
try {
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
  with (locals || {}) {
    ; 
    var viewYear = new Date(timestemp).getFullYear();
    var viewMonth = new Date(timestemp).getMonth();
    var viewDay = new Date(timestemp).getDate();

    function pad(s, n) {
        return String(s).padStart(n, '0');
    }

    function toISO(d) {
        return d.getFullYear() + '-' + pad(d.getMonth() + 1, 2) + '-' + pad(d.getDate(), 2);
    }

    ; __line = 13
    ; __append("\n\n<div class=\"calendar-popover years flex flex-col gap-4 bg-secondary border-2 border-accent rounded-2 p-1 overflow-h transition duration-200 w-full\">\n    <div class=\"calendar-popover-header flex flex-row items-center justify-between gap-2 border-b-2 border-card p-2 w-full\">\n        <div class=\"flex flex-row items-center gap-1\">\n            <button class=\"button flex flex-row items-center justify-center transition duration-200\" data-value=\"")
    ; __line = 18
    ; __append(escapeFn( toISO(new Date(viewYear - 10, viewMonth, viewDay)) ))
    ; __append("\">‹</button>\n        </div>\n\n        <button class=\"calendar-popover-date text-sm text-nowrap font-bold px-2 py-1 rounded-1 pointer transition duration-200\">")
    ; __line = 21
    ; __append(escapeFn( (Math.floor(viewYear / 10) * 10 + 1) + ' - ' + (Math.floor(viewYear / 10) * 10 + 10) ))
    ; __append("</button>\n\n        <div class=\"flex flex-row items-center gap-1\">\n            <button class=\"button flex flex-row items-center justify-center transition duration-200\" data-value=\"")
    ; __line = 24
    ; __append(escapeFn( toISO(new Date(viewYear + 10, viewMonth, viewDay)) ))
    ; __append("\">›</button>\n        </div>\n    </div>\n\n    <div class=\"calendar-popover-content px-2 pb-2\">\n        ")
    ; __line = 29
    ;  Array.from(Array(12), (e, i) => ({
            name: (Math.floor(viewYear / 10) * 10 + i + 1).toString(),
            value: toISO(new Date(Math.floor(viewYear / 10) * 10 + i + 1, viewMonth, viewDay)),
            type: Math.floor(viewYear / 10) * 10 + i + 1 == viewYear ? 'active' : i >= 10 ? 'outside' : null
        })).forEach(function(item){ 
    ; __line = 33
    ; __append("\n            <button class=\"calendar-popover-option ")
    ; __line = 34
    ; __append(escapeFn( item.type ))
    ; __append(" flex items-center justify-center text-sm rounded-1 pointer transition duration-200\" value=\"")
    ; __append(escapeFn( item.value ))
    ; __append("\" ")
    ;  if(item.type == 'outside'){ 
    ; __append("disabled")
    ;  } 
    ; __append(">")
    ; __append(escapeFn( item.name ))
    ; __append("</button>\n        ")
    ; __line = 35
    ;  }); 
    ; __append("\n    </div>\n</div>")
    ; __line = 37
  }
  return __output;
} catch (e) {
  rethrow(e, __lines, __filename, __line, escapeFn);
}

}
    return anonymous(edata);
}