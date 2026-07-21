function inputsCalendarPopoverDays(edata) {
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
  , __lines = "<%\n    var todayYear = new Date().getFullYear();\n    var todayMonth = new Date().getMonth();\n    var todayDay = new Date().getDate();\n\n    var viewYear = new Date(timestemp).getFullYear();\n    var viewMonth = new Date(timestemp).getMonth();\n    var viewDay = new Date(timestemp).getDate();\n\n    var firstDay = new Date(viewYear, viewMonth, 1).getDay();\n    var daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();\n    var daysInPrev = new Date(viewYear, viewMonth, 0).getDate();\n\n    var total = firstDay + daysInMonth;\n    var trailing = total % 7 === 0 ? 0 : 7 - (total % 7);\n\n    function pad(s, n) {\n        return String(s).padStart(n, '0');\n    }\n\n    function toISO(d) {\n        return d.getFullYear() + '-' + pad(d.getMonth() + 1, 2) + '-' + pad(d.getDate(), 2);\n    }\n%>\n\n<div class=\"calendar-popover days flex flex-col gap-4 bg-secondary border-2 border-accent rounded-2 p-1 overflow-h transition duration-200 w-full\">\n    <div class=\"calendar-popover-header flex flex-row items-center justify-between gap-2 border-b-2 border-card p-2 w-full\">\n        <div class=\"flex flex-row items-center gap-1\">\n            <button class=\"button flex flex-row items-center justify-center transition duration-200\" data-value=\"<%= toISO(new Date(viewYear - 1, viewMonth, viewDay)) %>\">«</button>\n            <button class=\"button flex flex-row items-center justify-center transition duration-200\" data-value=\"<%= toISO(new Date(viewYear, viewMonth - 1, viewDay)) %>\">‹</button>\n        </div>\n\n        <button class=\"calendar-popover-date text-sm text-nowrap font-bold px-2 py-1 rounded-1 pointer transition duration-200\"><%= [ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ][viewMonth] + ' ' + viewYear %></button>\n\n        <div class=\"flex flex-row items-center gap-1\">\n            <button class=\"button flex flex-row items-center justify-center transition duration-200\" data-value=\"<%= toISO(new Date(viewYear, viewMonth + 1, viewDay)) %>\">›</button>\n            <button class=\"button flex flex-row items-center justify-center transition duration-200\" data-value=\"<%= toISO(new Date(viewYear + 1, viewMonth, viewDay)) %>\">»</button>\n        </div>\n    </div>\n\n    <div class=\"flex flex-col gap-2 w-full\">\n        <div class=\"flex flex-row px-2 w-full\">\n            <div class=\"text-2xs text-center text-muted-foreground font-bold w-full\">Su</div>\n            <div class=\"text-2xs text-center text-muted-foreground font-bold w-full\">Mo</div>\n            <div class=\"text-2xs text-center text-muted-foreground font-bold w-full\">Tu</div>\n            <div class=\"text-2xs text-center text-muted-foreground font-bold w-full\">We</div>\n            <div class=\"text-2xs text-center text-muted-foreground font-bold w-full\">Th</div>\n            <div class=\"text-2xs text-center text-muted-foreground font-bold w-full\">Fr</div>\n            <div class=\"text-2xs text-center text-muted-foreground font-bold w-full\">Sa</div>\n        </div>\n\n        <div class=\"calendar-popover-content px-2\">\n            <% [\n                ...Array.from(Array(firstDay), (e, i) => ({\n                    name: (daysInPrev - firstDay + i + 1).toString(),\n                    value: toISO(new Date(viewYear, viewMonth - 1, daysInPrev - firstDay + i + 1)),\n                    type: 'outside'\n                })),\n                ...Array.from(Array(daysInMonth), (e, i) => ({\n                    name: (i + 1).toString(),\n                    value: toISO(new Date(viewYear, viewMonth, i + 1)),\n                    type: selected != null && i + 1 == new Date(selected).getDate() && viewMonth == new Date(selected).getMonth() && viewYear == new Date(selected).getFullYear() && i + 1 == todayDay && viewMonth == todayMonth && viewYear == todayYear ?\n                            'today active' :\n                        selected != null && i + 1 == new Date(selected).getDate() && viewMonth == new Date(selected).getMonth() && viewYear == new Date(selected).getFullYear() ?\n                            'active' :\n                        i + 1 == todayDay && viewMonth == todayMonth && viewYear == todayYear ?\n                            'today' :\n                            null\n                })),\n                ...Array.from(Array(trailing), (e, i) => ({\n                    name: (i + 1).toString(),\n                    value: toISO(new Date(viewYear, viewMonth + 1, i + 1)),\n                    type: 'outside'\n                }))\n            ].forEach(function(item){ %>\n                <button class=\"calendar-popover-option <%= item.type %> flex items-center justify-center text-sm rounded-1 pointer transition duration-200\" value=\"<%= item.value %>\" <% if(item.type == 'outside'){ %>disabled<% } %>><%= item.name %></button>\n            <% }); %>\n        </div>\n\n        <div class=\"calendar-popover-footer flex flex-row items-center justify-between gap-2 border-t-2 border-card px-4 py-2 w-full\">\n            <button class=\"button today transition duration-200\">Today</button>\n            <button class=\"button clear transition duration-200\">Clear</button>\n        </div>\n    </div>\n</div>"
  , __filename = undefined;
try {
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
  with (locals || {}) {
    ; 
    var todayYear = new Date().getFullYear();
    var todayMonth = new Date().getMonth();
    var todayDay = new Date().getDate();

    var viewYear = new Date(timestemp).getFullYear();
    var viewMonth = new Date(timestemp).getMonth();
    var viewDay = new Date(timestemp).getDate();

    var firstDay = new Date(viewYear, viewMonth, 1).getDay();
    var daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    var daysInPrev = new Date(viewYear, viewMonth, 0).getDate();

    var total = firstDay + daysInMonth;
    var trailing = total % 7 === 0 ? 0 : 7 - (total % 7);

    function pad(s, n) {
        return String(s).padStart(n, '0');
    }

    function toISO(d) {
        return d.getFullYear() + '-' + pad(d.getMonth() + 1, 2) + '-' + pad(d.getDate(), 2);
    }

    ; __line = 24
    ; __append("\n\n<div class=\"calendar-popover days flex flex-col gap-4 bg-secondary border-2 border-accent rounded-2 p-1 overflow-h transition duration-200 w-full\">\n    <div class=\"calendar-popover-header flex flex-row items-center justify-between gap-2 border-b-2 border-card p-2 w-full\">\n        <div class=\"flex flex-row items-center gap-1\">\n            <button class=\"button flex flex-row items-center justify-center transition duration-200\" data-value=\"")
    ; __line = 29
    ; __append(escapeFn( toISO(new Date(viewYear - 1, viewMonth, viewDay)) ))
    ; __append("\">«</button>\n            <button class=\"button flex flex-row items-center justify-center transition duration-200\" data-value=\"")
    ; __line = 30
    ; __append(escapeFn( toISO(new Date(viewYear, viewMonth - 1, viewDay)) ))
    ; __append("\">‹</button>\n        </div>\n\n        <button class=\"calendar-popover-date text-sm text-nowrap font-bold px-2 py-1 rounded-1 pointer transition duration-200\">")
    ; __line = 33
    ; __append(escapeFn( [ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ][viewMonth] + ' ' + viewYear ))
    ; __append("</button>\n\n        <div class=\"flex flex-row items-center gap-1\">\n            <button class=\"button flex flex-row items-center justify-center transition duration-200\" data-value=\"")
    ; __line = 36
    ; __append(escapeFn( toISO(new Date(viewYear, viewMonth + 1, viewDay)) ))
    ; __append("\">›</button>\n            <button class=\"button flex flex-row items-center justify-center transition duration-200\" data-value=\"")
    ; __line = 37
    ; __append(escapeFn( toISO(new Date(viewYear + 1, viewMonth, viewDay)) ))
    ; __append("\">»</button>\n        </div>\n    </div>\n\n    <div class=\"flex flex-col gap-2 w-full\">\n        <div class=\"flex flex-row px-2 w-full\">\n            <div class=\"text-2xs text-center text-muted-foreground font-bold w-full\">Su</div>\n            <div class=\"text-2xs text-center text-muted-foreground font-bold w-full\">Mo</div>\n            <div class=\"text-2xs text-center text-muted-foreground font-bold w-full\">Tu</div>\n            <div class=\"text-2xs text-center text-muted-foreground font-bold w-full\">We</div>\n            <div class=\"text-2xs text-center text-muted-foreground font-bold w-full\">Th</div>\n            <div class=\"text-2xs text-center text-muted-foreground font-bold w-full\">Fr</div>\n            <div class=\"text-2xs text-center text-muted-foreground font-bold w-full\">Sa</div>\n        </div>\n\n        <div class=\"calendar-popover-content px-2\">\n            ")
    ; __line = 53
    ;  [
                ...Array.from(Array(firstDay), (e, i) => ({
                    name: (daysInPrev - firstDay + i + 1).toString(),
                    value: toISO(new Date(viewYear, viewMonth - 1, daysInPrev - firstDay + i + 1)),
                    type: 'outside'
                })),
                ...Array.from(Array(daysInMonth), (e, i) => ({
                    name: (i + 1).toString(),
                    value: toISO(new Date(viewYear, viewMonth, i + 1)),
                    type: selected != null && i + 1 == new Date(selected).getDate() && viewMonth == new Date(selected).getMonth() && viewYear == new Date(selected).getFullYear() && i + 1 == todayDay && viewMonth == todayMonth && viewYear == todayYear ?
                            'today active' :
                        selected != null && i + 1 == new Date(selected).getDate() && viewMonth == new Date(selected).getMonth() && viewYear == new Date(selected).getFullYear() ?
                            'active' :
                        i + 1 == todayDay && viewMonth == todayMonth && viewYear == todayYear ?
                            'today' :
                            null
                })),
                ...Array.from(Array(trailing), (e, i) => ({
                    name: (i + 1).toString(),
                    value: toISO(new Date(viewYear, viewMonth + 1, i + 1)),
                    type: 'outside'
                }))
            ].forEach(function(item){ 
    ; __line = 75
    ; __append("\n                <button class=\"calendar-popover-option ")
    ; __line = 76
    ; __append(escapeFn( item.type ))
    ; __append(" flex items-center justify-center text-sm rounded-1 pointer transition duration-200\" value=\"")
    ; __append(escapeFn( item.value ))
    ; __append("\" ")
    ;  if(item.type == 'outside'){ 
    ; __append("disabled")
    ;  } 
    ; __append(">")
    ; __append(escapeFn( item.name ))
    ; __append("</button>\n            ")
    ; __line = 77
    ;  }); 
    ; __append("\n        </div>\n\n        <div class=\"calendar-popover-footer flex flex-row items-center justify-between gap-2 border-t-2 border-card px-4 py-2 w-full\">\n            <button class=\"button today transition duration-200\">Today</button>\n            <button class=\"button clear transition duration-200\">Clear</button>\n        </div>\n    </div>\n</div>")
    ; __line = 85
  }
  return __output;
} catch (e) {
  rethrow(e, __lines, __filename, __line, escapeFn);
}

}
    return anonymous(edata);
}