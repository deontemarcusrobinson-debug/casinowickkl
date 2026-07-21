function chatUserMessage(edata) {
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
  , __lines = "<div class=\"chat-message flex flex-col gap-2 relative p-2 chat-content-<%= { '0': 'member', '1': 'admin', '2': 'moderator', '3': 'helper', '4': 'veteran', '5': 'pro', '6': 'youtuber', '7': 'streamer', '8': 'developer', '100': 'owner' }[rank] %>\" data-message=\"<%= id %>\">\n    <div class=\"flex flex-row items-center gap-1 relative w-full pl-1\">\n        <%- userAvatar({ user, size: 'size-10' }); %>\n\n        <div class=\"chat-message-header flex flex-col justify-center gap-1\">\n            <div class=\"flex flex-row gap-4 justify-between items-center\">\n                <div class=\"chat-message-name chat-link-<%= { '0': 'member', '1': 'admin', '2': 'moderator', '3': 'helper', '4': 'veteran', '5': 'pro', '6': 'youtuber', '7': 'streamer', '8': 'developer', '100': 'owner' }[rank] %> truncate\">\n                    <% if(rank != 0) { %>\n                        <div class=\"chat-message-rank mr-1 rounded-1 chat-rank-<%= { '0': 'member', '1': 'admin', '2': 'moderator', '3': 'helper', '4': 'veteran', '5': 'pro', '6': 'youtuber', '7': 'streamer', '8': 'developer', '100': 'owner' }[rank] %>\"><%= { '0': 'member', '1': 'admin', '2': 'moderator', '3': 'helper', '4': 'veteran', '5': 'pro', '6': 'youtuber', '7': 'streamer', '8': 'developer', '100': 'owner' }[rank] %></div>\n                    <% } %>\n\n                    <%= user.name %>\n                </div>\n\n                <%- overflowMenu({\n                    items: []\n                }); %>\n            </div>\n\n            <div class=\"chat-message-time\"><%= time %></div>\n        </div>\n    </div>\n\n    <div class=\"flex flex-col gap-2 bg-card p-2 rounded-2\">\n        <% if(reply != null){ %>\n            <div class=\"chat-reply flex flex-row items-center gap-2\">\n                <%- icon({\n                    icon: 'reply',\n                    id: null,\n                    className: 'size-3.5'\n                }); %>\n\n                <div class=\"inline-block\">\n                    <img class=\"avatar\" src=\"<%= reply.user.avatar %>\">\n\n                    <span class=\"name\"><%= reply.user.name %></span>\n                    <span class=\"message\"><%- reply.message %></span>\n                </div>\n            </div>\n        <% } %>\n\n        <div class=\"chat-message-content\"><%- message %></div>\n    </div>\n</div>"
  , __filename = undefined;
try {
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
  with (locals || {}) {
    ; __append("<div class=\"chat-message flex flex-col gap-2 relative p-2 chat-content-")
    ; __append(escapeFn( { '0': 'member', '1': 'admin', '2': 'moderator', '3': 'helper', '4': 'veteran', '5': 'pro', '6': 'youtuber', '7': 'streamer', '8': 'developer', '100': 'owner' }[rank] ))
    ; __append("\" data-message=\"")
    ; __append(escapeFn( id ))
    ; __append("\">\n    <div class=\"flex flex-row items-center gap-1 relative w-full pl-1\">\n        ")
    ; __line = 3
    ; __append( userAvatar({ user, size: 'size-10' }) )
    ; __append("\n\n        <div class=\"chat-message-header flex flex-col justify-center gap-1\">\n            <div class=\"flex flex-row gap-4 justify-between items-center\">\n                <div class=\"chat-message-name chat-link-")
    ; __line = 7
    ; __append(escapeFn( { '0': 'member', '1': 'admin', '2': 'moderator', '3': 'helper', '4': 'veteran', '5': 'pro', '6': 'youtuber', '7': 'streamer', '8': 'developer', '100': 'owner' }[rank] ))
    ; __append(" truncate\">\n                    ")
    ; __line = 8
    ;  if(rank != 0) { 
    ; __append("\n                        <div class=\"chat-message-rank mr-1 rounded-1 chat-rank-")
    ; __line = 9
    ; __append(escapeFn( { '0': 'member', '1': 'admin', '2': 'moderator', '3': 'helper', '4': 'veteran', '5': 'pro', '6': 'youtuber', '7': 'streamer', '8': 'developer', '100': 'owner' }[rank] ))
    ; __append("\">")
    ; __append(escapeFn( { '0': 'member', '1': 'admin', '2': 'moderator', '3': 'helper', '4': 'veteran', '5': 'pro', '6': 'youtuber', '7': 'streamer', '8': 'developer', '100': 'owner' }[rank] ))
    ; __append("</div>\n                    ")
    ; __line = 10
    ;  } 
    ; __append("\n\n                    ")
    ; __line = 12
    ; __append(escapeFn( user.name ))
    ; __append("\n                </div>\n\n                ")
    ; __line = 15
    ; __append( overflowMenu({
                    items: []
                }) )
    ; __line = 17
    ; __append("\n            </div>\n\n            <div class=\"chat-message-time\">")
    ; __line = 20
    ; __append(escapeFn( time ))
    ; __append("</div>\n        </div>\n    </div>\n\n    <div class=\"flex flex-col gap-2 bg-card p-2 rounded-2\">\n        ")
    ; __line = 25
    ;  if(reply != null){ 
    ; __append("\n            <div class=\"chat-reply flex flex-row items-center gap-2\">\n                ")
    ; __line = 27
    ; __append( icon({
                    icon: 'reply',
                    id: null,
                    className: 'size-3.5'
                }) )
    ; __line = 31
    ; __append("\n\n                <div class=\"inline-block\">\n                    <img class=\"avatar\" src=\"")
    ; __line = 34
    ; __append(escapeFn( reply.user.avatar ))
    ; __append("\">\n\n                    <span class=\"name\">")
    ; __line = 36
    ; __append(escapeFn( reply.user.name ))
    ; __append("</span>\n                    <span class=\"message\">")
    ; __line = 37
    ; __append( reply.message )
    ; __append("</span>\n                </div>\n            </div>\n        ")
    ; __line = 40
    ;  } 
    ; __append("\n\n        <div class=\"chat-message-content\">")
    ; __line = 42
    ; __append( message )
    ; __append("</div>\n    </div>\n</div>")
    ; __line = 44
  }
  return __output;
} catch (e) {
  rethrow(e, __lines, __filename, __line, escapeFn);
}

}
    return anonymous(edata);
}