/* Anwaar AI - tiny, XSS-safe markdown renderer.
   Everything is HTML-escaped first; only a small whitelist of tags is produced. */
(function (root) {
  'use strict';

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function safeUrl(u) {
    return /^https?:\/\/[^\s<>"']+$/i.test(u) ? u : null;
  }

  // Inline formatting on an already-escaped string
  function inline(s) {
    var codes = [];
    s = s.replace(/`([^`\n]+)`/g, function (_, c) {
      codes.push('<code>' + c + '</code>');
      return '\u0000' + (codes.length - 1) + '\u0000';
    });
    // links [text](url)  (url was escaped: &amp; is fine inside href)
    s = s.replace(/\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g, function (m, t, u) {
      var raw = u.replace(/&amp;/g, '&');
      return safeUrl(raw) ? '<a href="' + u + '" target="_blank" rel="noopener noreferrer">' + t + '</a>' : m;
    });
    // bare URLs (not already inside an href / tag)
    s = s.replace(/(^|[\s(>])(https?:\/\/[^\s<)]+[^\s<).,;:!?])/g, function (m, pre, u) {
      var raw = u.replace(/&amp;/g, '&');
      return safeUrl(raw) ? pre + '<a href="' + u + '" target="_blank" rel="noopener noreferrer">' + u + '</a>' : m;
    });
    s = s.replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[^*\w])\*([^*\n]+?)\*(?!\*)/g, '$1<em>$2</em>');
    s = s.replace(/\u0000(\d+)\u0000/g, function (_, i) { return codes[+i]; });
    return s;
  }

  function splitRow(line) {
    line = line.trim();
    if (line.charAt(0) === '|') line = line.slice(1);
    if (line.charAt(line.length - 1) === '|') line = line.slice(0, -1);
    return line.split('|').map(function (c) { return c.trim(); });
  }

  function isTableSep(line) {
    return /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(line) && line.indexOf('|') !== -1;
  }

  function renderBlocks(text) {
    var lines = text.split('\n');
    var out = [];
    var i = 0;
    var para = [];

    function flushPara() {
      if (para.length) {
        out.push('<p dir="auto">' + inline(esc(para.join('\n')).replace(/\n/g, '<br>')) + '</p>');
        para = [];
      }
    }

    while (i < lines.length) {
      var line = lines[i];

      if (/^\s*$/.test(line)) { flushPara(); i++; continue; }

      var h = /^(#{1,4})\s+(.+?)\s*#*\s*$/.exec(line);
      if (h) {
        flushPara();
        var lvl = Math.min(h[1].length + 1, 5); // # -> h2 ... keeps headings small in chat
        out.push('<h' + lvl + ' dir="auto">' + inline(esc(h[2])) + '</h' + lvl + '>');
        i++; continue;
      }

      if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) { flushPara(); out.push('<hr>'); i++; continue; }

      if (/^\s*>/.test(line)) {
        flushPara();
        var q = [];
        while (i < lines.length && /^\s*>/.test(lines[i])) { q.push(lines[i].replace(/^\s*>\s?/, '')); i++; }
        out.push('<blockquote dir="auto">' + inline(esc(q.join('\n')).replace(/\n/g, '<br>')) + '</blockquote>');
        continue;
      }

      if (line.indexOf('|') !== -1 && i + 1 < lines.length && isTableSep(lines[i + 1])) {
        flushPara();
        var head = splitRow(line);
        i += 2;
        var rows = [];
        while (i < lines.length && lines[i].indexOf('|') !== -1 && !/^\s*$/.test(lines[i])) {
          rows.push(splitRow(lines[i])); i++;
        }
        var t = '<div class="tbl"><table><thead><tr>';
        head.forEach(function (c) { t += '<th dir="auto">' + inline(esc(c)) + '</th>'; });
        t += '</tr></thead><tbody>';
        rows.forEach(function (r) {
          t += '<tr>';
          for (var k = 0; k < head.length; k++) t += '<td dir="auto">' + inline(esc(r[k] || '')) + '</td>';
          t += '</tr>';
        });
        t += '</tbody></table></div>';
        out.push(t);
        continue;
      }

      var ul = /^\s*([-*+•])\s+(.*)$/.exec(line);
      var ol = /^\s*(\d{1,3})[.)]\s+(.*)$/.exec(line);
      if (ul || ol) {
        flushPara();
        var ordered = !!ol;
        var items = [];
        while (i < lines.length) {
          var m = ordered ? /^\s*(\d{1,3})[.)]\s+(.*)$/.exec(lines[i]) : /^\s*([-*+•])\s+(.*)$/.exec(lines[i]);
          if (!m) {
            // continuation line (indented) belongs to previous item
            if (items.length && /^\s{2,}\S/.test(lines[i])) { items[items.length - 1] += '\n' + lines[i].trim(); i++; continue; }
            break;
          }
          items.push(m[2]); i++;
        }
        var tag = ordered ? 'ol' : 'ul';
        out.push('<' + tag + '>' + items.map(function (it) {
          return '<li dir="auto">' + inline(esc(it).replace(/\n/g, '<br>')) + '</li>';
        }).join('') + '</' + tag + '>');
        continue;
      }

      para.push(line);
      i++;
    }
    flushPara();
    return out.join('');
  }

  function renderMarkdown(src) {
    src = String(src == null ? '' : src).replace(/\r\n?/g, '\n');
    var html = '';
    var last = 0;
    var re = /```([\w+-]*)[ \t]*\n?([\s\S]*?)(```|$)/g;
    var m;
    while ((m = re.exec(src)) !== null) {
      if (m.index === re.lastIndex) re.lastIndex++;
      html += renderBlocks(src.slice(last, m.index));
      var lang = m[1] ? '<span class="lang">' + esc(m[1]) + '</span>' : '';
      html += '<div class="code">' + lang +
        '<button class="copy-code" type="button">Copy</button>' +
        '<pre dir="ltr"><code>' + esc(m[2].replace(/\n$/, '')) + '</code></pre></div>';
      last = re.lastIndex;
      if (m[3] === '') break; // unclosed fence reached the end (streaming)
    }
    html += renderBlocks(src.slice(last));
    return html;
  }

  // Plain text version (for speech / copy)
  function toPlain(src) {
    return String(src == null ? '' : src)
      .replace(/```[\s\S]*?(```|$)/g, ' ')
      .replace(/`([^`]*)`/g, '$1')
      .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/^\s*[-*+•]\s+/gm, '')
      .replace(/(\*\*|__|\*|_)/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/\s+\n/g, '\n')
      .trim();
  }

  var api = { renderMarkdown: renderMarkdown, toPlain: toPlain, esc: esc };
  root.AnwaarMD = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
