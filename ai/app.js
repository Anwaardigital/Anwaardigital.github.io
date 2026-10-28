/* Anwaar AI 2.0 front-end. Plain JavaScript, no build step.
   The interface is English. Replies come back in whatever language the user writes in. */
(function () {
  'use strict';

  var CFG = window.ANWAAR_CONFIG || {};
  var MD = window.AnwaarMD;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var KEY_CHATS = 'anwaar_ai_chats_v2';
  var KEY_OLD = 'anwaar_ai_chats_v1';
  var KEY_PREFS = 'anwaar_ai_prefs_v2';
  var MAX_CHATS = 60;
  var MAX_SEND = 20;
  var MAX_FILE_CHARS = 12000;
  var MAX_FILE_BYTES = 400 * 1024;

  // There is no topic picker: the assistant works out what is needed from the message itself.
  // The only switch is "Create image", which turns the message box into an image prompt box.
  function normMode(m) { return m === 'image' ? 'image' : 'general'; }
  var STYLES = [
    { id: 'auto', label: 'Auto' }, { id: 'photo', label: 'Photo' }, { id: 'art', label: 'Art' },
    { id: 'anime', label: 'Anime' }, { id: '3d', label: '3D' }, { id: 'logo', label: 'Logo' },
    { id: 'islamic', label: 'Islamic art' }, { id: 'thumbnail', label: 'Thumbnail' }
  ];
  var DEFAULT_PREFS = { theme: 'system', size: 'm', urdu: 'naskh', vlang: 'ur-PK', autoread: false, name: '', instr: '' };

  var ICON = {
    copy: '<svg viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V6.5A2.5 2.5 0 0 0 13.5 4h-7A2.5 2.5 0 0 0 4 6.5v7A2.5 2.5 0 0 0 6.5 16H8"/></svg>',
    speak: '<svg viewBox="0 0 24 24"><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5zM15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/></svg>',
    redo: '<svg viewBox="0 0 24 24"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/></svg>',
    edit: '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16zM13.5 6.5l4 4"/></svg>',
    flag: '<svg viewBox="0 0 24 24"><path d="M5 21V4M5 4h11l-1.8 3.5L16 11H5"/></svg>',
    download: '<svg viewBox="0 0 24 24"><path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19h14"/></svg>',
    share: '<svg viewBox="0 0 24 24"><circle cx="6" cy="12" r="2.3"/><circle cx="17.5" cy="6" r="2.3"/><circle cx="17.5" cy="18" r="2.3"/><path d="M8 11l7.5-4M8 13l7.5 4"/></svg>',
    del: '<svg viewBox="0 0 24 24"><path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12"/></svg>',
    spark: '<svg viewBox="0 0 24 24"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM18.5 15l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/></svg>',
    file: '<svg viewBox="0 0 24 24"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5"/></svg>'
  };
  var LOGO = '<svg class="mark" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="21" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M30.5 12.2a13 13 0 1 0 0 23.6A10.4 10.4 0 0 1 30.5 12.2z" fill="currentColor"/><circle cx="33.5" cy="17" r="2.2" fill="currentColor"/></svg>';

  var state = {
    chats: [], currentId: null,
    mode: 'general', style: 'auto', aspect: 'square',
    att: null, busy: false, controller: null,
    prefs: {}, speakingEl: null, rec: null, recOn: false,
    remaining: null, imgRemaining: null,
    installEvt: null, reportIdx: -1, search: ''
  };

  /* ================= small helpers ================= */

  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function cur() { return state.chats.find(function (c) { return c.id === state.currentId; }); }
  function nonEmpty(c) { return !!(c && c.messages && c.messages.some(function (m) { return !m.error; })); }
  function hasArabicScript(t) { return /[؀-ۿ]/.test(t); }
  function apiBase() { return String(CFG.API_URL || '').replace(/\/(chat|image|report)\/?$/, '').replace(/\/$/, ''); }
  function configured() { var u = String(CFG.API_URL || ''); return !!u && u.indexOf('YOUR-SUBDOMAIN') === -1; }

  function scrollDown(force) {
    var m = $('#messages');
    var near = m.scrollHeight - m.scrollTop - m.clientHeight < 180;
    if (force || near) m.scrollTop = m.scrollHeight;
  }

  function copyText(t) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(t).catch(function () { fallbackCopy(t); });
    }
    fallbackCopy(t);
    return Promise.resolve();
  }
  function fallbackCopy(t) {
    var ta = document.createElement('textarea');
    ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
  }

  function downloadBlob(blob, name) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  /* ---------- toast (one at a time, with optional Undo) ---------- */
  var toastTimer = null, toastExpire = null;
  function hideToast(runExpire) {
    var t = $('#toast');
    clearTimeout(toastTimer);
    t.hidden = true;
    var fn = toastExpire; toastExpire = null;
    if (runExpire && fn) fn();
  }
  function toast(text, opts) {
    opts = opts || {};
    hideToast(true);
    var t = $('#toast');
    t.textContent = '';
    t.appendChild(el('span', null, text));
    toastExpire = opts.onExpire || null;
    if (opts.action) {
      var b = el('button', null, opts.action);
      b.type = 'button';
      b.addEventListener('click', function () { toastExpire = null; hideToast(false); if (opts.onAction) opts.onAction(); });
      t.appendChild(b);
    }
    t.hidden = false;
    toastTimer = setTimeout(function () { hideToast(true); }, opts.ms || 3200);
  }

  /* ================= picture storage (IndexedDB, memory fallback) ================= */

  var Blobs = (function () {
    var dbp = null, mem = new Map(), urls = new Map();
    function open() {
      if (dbp) return dbp;
      dbp = new Promise(function (resolve) {
        try {
          var rq = indexedDB.open('anwaar-ai', 1);
          rq.onupgradeneeded = function () { rq.result.createObjectStore('blobs'); };
          rq.onsuccess = function () { resolve(rq.result); };
          rq.onerror = function () { resolve(null); };
          rq.onblocked = function () { resolve(null); };
        } catch (e) { resolve(null); }
      });
      return dbp;
    }
    function run(mode, fn) {
      return open().then(function (db) {
        if (!db) return null;
        return new Promise(function (resolve) {
          try {
            var t = db.transaction('blobs', mode), rq = fn(t.objectStore('blobs'));
            t.oncomplete = function () { resolve(rq ? rq.result : null); };
            t.onerror = t.onabort = function () { resolve(null); };
          } catch (e) { resolve(null); }
        });
      });
    }
    return {
      put: function (id, blob) { mem.set(id, blob); return run('readwrite', function (s) { return s.put(blob, id); }); },
      get: function (id) {
        if (mem.has(id)) return Promise.resolve(mem.get(id));
        return run('readonly', function (s) { return s.get(id); }).then(function (b) {
          if (b) mem.set(id, b);
          return b || null;
        });
      },
      url: function (id) {
        if (urls.has(id)) return Promise.resolve(urls.get(id));
        return this.get(id).then(function (b) {
          if (!b) return null;
          var u = URL.createObjectURL(b); urls.set(id, u); return u;
        });
      },
      dataUrl: function (id) { return this.get(id).then(function (b) { return b ? blobToDataUrl(b) : null; }); },
      del: function (id) {
        mem.delete(id);
        if (urls.has(id)) { URL.revokeObjectURL(urls.get(id)); urls.delete(id); }
        return run('readwrite', function (s) { return s.delete(id); });
      },
      clear: function () {
        mem.clear(); urls.forEach(function (u) { URL.revokeObjectURL(u); }); urls.clear();
        return run('readwrite', function (s) { return s.clear(); });
      }
    };
  })();

  function blobIdsOf(messages) {
    return messages.filter(function (m) { return m.imgId; }).map(function (m) { return m.imgId; });
  }
  function purge(ids) { ids.forEach(function (id) { Blobs.del(id); }); }

  function blobToDataUrl(blob) {
    return new Promise(function (resolve) {
      var r = new FileReader();
      r.onload = function () { resolve(String(r.result)); };
      r.onerror = function () { resolve(null); };
      r.readAsDataURL(blob);
    });
  }
  function dataUrlToBlob(u) {
    var m = /^data:([^;,]+)(;base64)?,([\s\S]*)$/.exec(u || '');
    if (!m) return null;
    try {
      var bin = m[2] ? atob(m[3]) : decodeURIComponent(m[3]);
      var arr = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      return new Blob([arr], { type: m[1] });
    } catch (e) { return null; }
  }
  function loadImage(blob) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(blob), img = new Image();
      img.onload = function () { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('image')); };
      img.src = url;
    });
  }
  // The image model draws squares. For portrait or landscape we crop the centre to 3:4 or 4:3.
  function cropToAspect(blob, aspect) {
    if (aspect !== 'portrait' && aspect !== 'landscape') return Promise.resolve(blob);
    return loadImage(blob).then(function (img) {
      var w = img.naturalWidth, h = img.naturalHeight;
      if (!w || !h || Math.abs(w / h - 1) > 0.06) return blob; // already not square
      var cw = w, ch = h;
      if (aspect === 'portrait') cw = Math.round(h * 3 / 4); else ch = Math.round(w * 3 / 4);
      var cv = document.createElement('canvas');
      cv.width = cw; cv.height = ch;
      cv.getContext('2d').drawImage(img, Math.round((w - cw) / 2), Math.round((h - ch) / 2), cw, ch, 0, 0, cw, ch);
      return new Promise(function (resolve) { cv.toBlob(function (b) { resolve(b || blob); }, 'image/jpeg', 0.93); });
    }).catch(function () { return blob; });
  }

  /* ================= preferences ================= */

  function loadPrefs() {
    var p = {};
    try { p = JSON.parse(lsGet(KEY_PREFS) || '{}') || {}; } catch (e) { p = {}; }
    state.prefs = Object.assign({}, DEFAULT_PREFS, p);
  }
  function setPref(k, v) {
    state.prefs[k] = v;
    lsSet(KEY_PREFS, JSON.stringify(state.prefs));
    if (k === 'theme' || k === 'size' || k === 'urdu') applyPrefs();
  }
  function effectiveTheme() {
    var t = state.prefs.theme;
    if (t === 'dark' || t === 'light') return t;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  function applyPrefs() {
    var h = document.documentElement, th = effectiveTheme();
    h.setAttribute('data-theme', th);
    h.setAttribute('data-size', state.prefs.size);
    h.setAttribute('data-urdu', state.prefs.urdu);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', th === 'dark' ? '#0b2016' : '#eef3ef');
  }

  /* ================= chats: storage ================= */

  function loadChats() {
    var raw = lsGet(KEY_CHATS), list = null;
    try { list = JSON.parse(raw || 'null'); } catch (e) { list = null; }
    if (!Array.isArray(list)) {
      // bring over chats from version 1 (text only)
      try {
        var old = JSON.parse(lsGet(KEY_OLD) || '[]');
        list = Array.isArray(old) ? old.map(function (c) {
          c.messages = (c.messages || []).filter(function (m) { return m && !m.error && typeof m.text === 'string'; })
            .map(function (m) { return { role: m.role, text: m.text }; });
          return c;
        }) : [];
      } catch (e) { list = []; }
    }
    state.chats = list.filter(function (c) { return c && c.id && Array.isArray(c.messages); });
  }
  function save() {
    state.chats.sort(function (a, b) { return b.ts - a.ts; });
    if (state.chats.length > MAX_CHATS) {
      var dropped = state.chats.slice(MAX_CHATS);
      state.chats = state.chats.slice(0, MAX_CHATS);
      dropped.forEach(function (c) { purge(blobIdsOf(c.messages)); });
    }
    var keep = state.chats.filter(nonEmpty);
    var json = JSON.stringify(keep, function (k, v) {
      if (k.charAt(0) === '_') return undefined; // temporary fields never reach storage
      if (k === 'messages' && Array.isArray(v)) return v.filter(function (m) { return !m.error; });
      return v;
    });
    if (!lsSet(KEY_CHATS, json)) {
      // storage full: keep only the 20 newest chats and try once more
      var trimmed = JSON.stringify(keep.slice(0, 20), function (k, v) { return k.charAt(0) === '_' ? undefined : v; });
      lsSet(KEY_CHATS, trimmed);
    }
  }
  function ensureCurrent() {
    var c = cur();
    if (c) return c;
    var first = state.chats.find(nonEmpty);
    if (first) { state.currentId = first.id; return first; }
    c = { id: uid(), title: '', mode: 'general', ts: Date.now(), messages: [] };
    state.chats.unshift(c);
    state.currentId = c.id;
    return c;
  }
  function titleFrom(text) {
    var t = String(text || '').replace(/\s+/g, ' ').trim();
    return t.length > 44 ? t.slice(0, 44) + '…' : (t || 'New chat');
  }
  function dropErrors(c) { c.messages = c.messages.filter(function (m) { return !m.error; }); }

  /* ================= sidebar ================= */

  function openMenu(v) { $('#app').classList.toggle('menu-open', v); }

  function groupOf(ts) {
    var now = new Date();
    var sod = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    if (ts >= sod) return 'Today';
    if (ts >= sod - 864e5) return 'Yesterday';
    if (ts >= sod - 7 * 864e5) return 'Previous 7 days';
    return 'Older';
  }

  function matchesSearch(c, q) {
    if (!q) return true;
    if ((c.title || '').toLowerCase().indexOf(q) !== -1) return true;
    return c.messages.some(function (m) { return typeof m.text === 'string' && m.text.toLowerCase().indexOf(q) !== -1; });
  }

  function renderSidebar() {
    var list = $('#chatList');
    list.innerHTML = '';
    var q = state.search.trim().toLowerCase();
    var shown = state.chats.filter(nonEmpty).filter(function (c) { return matchesSearch(c, q); });
    if (!shown.length) {
      list.appendChild(el('div', 'chat-empty', q ? 'No chats match your search.' : 'Your chats will appear here.'));
      return;
    }
    var lastGroup = '';
    shown.forEach(function (c) {
      var g = groupOf(c.ts);
      if (g !== lastGroup) { list.appendChild(el('div', 'group-label', g)); lastGroup = g; }
      var row = el('div', 'chat-item' + (c.id === state.currentId ? ' active' : ''));
      row.setAttribute('role', 'listitem');
      var t = el('button', 't', c.title || 'New chat');
      t.type = 'button'; t.setAttribute('dir', 'auto');
      t.addEventListener('click', function () { openChat(c.id); openMenu(false); });
      var d = el('button', 'del');
      d.type = 'button'; d.setAttribute('aria-label', 'Delete chat');
      d.innerHTML = ICON.del;
      d.addEventListener('click', function (e) { e.stopPropagation(); deleteChat(c.id); });
      row.appendChild(t); row.appendChild(d);
      list.appendChild(row);
    });
  }

  /* ================= chat actions ================= */

  function newChat() {
    stopSpeaking();
    var existing = cur();
    if (!existing || nonEmpty(existing)) {
      var c = { id: uid(), title: '', mode: state.mode, ts: Date.now(), messages: [] };
      state.chats.unshift(c);
      state.currentId = c.id;
    }
    renderAll();
    openMenu(false);
    $('#input').focus();
  }
  function openChat(id) {
    stopSpeaking();
    state.currentId = id;
    var c = cur();
    if (c) state.mode = normMode(c.mode);
    renderAll();
  }
  function deleteChat(id) {
    var i = state.chats.findIndex(function (c) { return c.id === id; });
    if (i < 0) return;
    var chat = state.chats.splice(i, 1)[0];
    var wasCurrent = state.currentId === id;
    if (wasCurrent) state.currentId = null;
    save();
    if (wasCurrent) ensureCurrent();
    renderAll();
    toast('Chat deleted', {
      action: 'Undo', ms: 6000,
      onAction: function () {
        state.chats.push(chat); save();
        state.currentId = chat.id; state.mode = normMode(chat.mode);
        renderAll();
      },
      onExpire: function () { purge(blobIdsOf(chat.messages)); }
    });
  }
  function renameChat() {
    var c = cur();
    if (!c || !nonEmpty(c)) return toast('Send a message first.');
    var name = window.prompt('Rename chat', c.title || '');
    if (name == null) return;
    name = name.replace(/\s+/g, ' ').trim();
    if (!name) return;
    c.title = name.slice(0, 80);
    save(); renderAll();
  }

  function conversationText(c) {
    return c.messages.filter(function (m) { return !m.error; }).map(function (m) {
      if (m.kind === 'image') return 'Anwaar AI: [Image] ' + (m.prompt || '');
      var who = m.role === 'user' ? 'You' : 'Anwaar AI';
      var extra = m.file ? ' [Attached file: ' + m.file.name + ']' : (m.imgId ? ' [Photo]' : '');
      return who + ': ' + m.text + extra;
    }).join('\n\n');
  }
  function chatMarkdown(c) {
    var out = ['# ' + (c.title || 'Chat'), '', '_Exported from Anwaar AI on ' + new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) + '_', ''];
    c.messages.filter(function (m) { return !m.error; }).forEach(function (m) {
      if (m.kind === 'image') { out.push('**Anwaar AI**', '', '[Image created] ' + (m.prompt || ''), ''); return; }
      out.push(m.role === 'user' ? '**You**' : '**Anwaar AI**', '', m.text + (m.file ? '\n\n(Attached file: ' + m.file.name + ')' : ''), '');
    });
    return out.join('\n');
  }
  function safeName(s) { return (String(s || 'chat').replace(/[^\w؀-ۿ -]+/g, '').trim().replace(/\s+/g, '-').slice(0, 40)) || 'chat'; }

  function chatMenuAction(act) {
    var c = cur();
    if (act !== 'rename' && (!c || !nonEmpty(c))) return toast('Nothing here yet.');
    if (act === 'rename') return renameChat();
    if (act === 'export') {
      downloadBlob(new Blob([chatMarkdown(c)], { type: 'text/markdown;charset=utf-8' }), 'anwaar-ai-' + safeName(c.title) + '.md');
      return toast('Chat exported.');
    }
    if (act === 'copy') return copyText(conversationText(c)).then(function () { toast('Conversation copied.'); });
    if (act === 'share') {
      if (navigator.share) return navigator.share({ title: c.title || 'Anwaar AI chat', text: conversationText(c) }).catch(function () {});
      return copyText(conversationText(c)).then(function () { toast('Sharing is not available here. Conversation copied.'); });
    }
    if (act === 'delete') return deleteChat(c.id);
  }

  /* ================= rendering ================= */

  function renderAll() {
    renderSidebar();
    renderModes();
    renderImageOptions();
    renderMessages();
    var c = cur();
    $('#topTitle').textContent = (c && c.title) || 'Anwaar AI';
    $('#input').placeholder = state.mode === 'image' ? 'Describe an image' : 'Message Anwaar AI';
  }

  function renderModes() {
    var box = $('#modes');
    box.innerHTML = '';
    var on = state.mode === 'image';
    var b = el('button', 'mode' + (on ? ' active' : ''));
    b.type = 'button';
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    b.insertAdjacentHTML('beforeend', ICON.spark);
    b.appendChild(document.createTextNode('Create image'));
    b.addEventListener('click', function () { setMode(on ? 'general' : 'image'); });
    box.appendChild(b);
  }
  function setMode(id) {
    state.mode = normMode(id);
    var c = cur();
    if (c) { c.mode = id; if (nonEmpty(c)) save(); }
    renderAll();
  }

  function renderImageOptions() {
    var on = state.mode === 'image';
    $('#imgOpts').hidden = !on;
    var chips = $('#styleChips');
    if (!chips.childNodes.length) {
      STYLES.forEach(function (s) {
        var b = el('button', null, s.label);
        b.type = 'button'; b.setAttribute('role', 'radio'); b.dataset.v = s.id;
        b.addEventListener('click', function () { state.style = s.id; syncImageOptions(); });
        chips.appendChild(b);
      });
      $$('#aspectSeg button').forEach(function (b) {
        b.addEventListener('click', function () { state.aspect = b.dataset.v; syncImageOptions(); });
      });
    }
    syncImageOptions();
  }
  function syncImageOptions() {
    $$('#styleChips button').forEach(function (b) { b.setAttribute('aria-checked', b.dataset.v === state.style ? 'true' : 'false'); });
    $$('#aspectSeg button').forEach(function (b) { b.setAttribute('aria-checked', b.dataset.v === state.aspect ? 'true' : 'false'); });
  }

  function renderMessages() {
    var box = $('#messages');
    box.innerHTML = '';
    var c = cur();
    if (!c || !c.messages.length) { box.appendChild(welcomeView()); return; }
    var lastAi = -1;
    c.messages.forEach(function (m, i) { if (m.role === 'assistant') lastAi = i; });
    c.messages.forEach(function (m, i) { box.appendChild(messageView(m, i, i === lastAi && i === c.messages.length - 1)); });
    state.stickUntil = Date.now() + 2000; // pictures load a moment later; keep the view at the bottom meanwhile
    scrollDown(true);
    updateToBottom();
  }
  function stickIfNeeded() { if (Date.now() < state.stickUntil) scrollDown(true); }

  function welcomeView() {
    var w = el('div', 'welcome');
    w.insertAdjacentHTML('beforeend', LOGO);
    var img = state.mode === 'image';
    w.appendChild(el('h1', null, img ? 'What should I create?' : 'How can I help you today?'));
    w.appendChild(el('p', null, img
      ? 'Describe your picture in Urdu, Roman Urdu or English. Pick a style and shape below.'
      : 'Ask in Urdu, Roman Urdu or English. I will answer in the language you write in.'));
    return w;
  }

  function actBtn(label, icon, fn) {
    var b = el('button');
    b.type = 'button';
    b.innerHTML = ICON[icon] + '<span></span>';
    b.lastChild.textContent = label;
    b.addEventListener('click', function () { fn(b); });
    return b;
  }

  function messageView(m, idx, isLastAi) {
    var wrap = el('div', 'msg ' + (m.role === 'user' ? 'user' : 'ai') + (m.error ? ' err' : ''));
    wrap.dataset.idx = String(idx);

    if (m.role === 'user') {
      if (m.imgId) {
        var im = el('img', 'attached'); im.alt = 'Your photo';
        im.addEventListener('load', stickIfNeeded);
        Blobs.url(m.imgId).then(function (u) { if (u) im.src = u; else im.remove(); });
        wrap.appendChild(im);
      }
      if (m.file) {
        var chip = el('div', 'file-chip');
        chip.insertAdjacentHTML('beforeend', ICON.file);
        chip.appendChild(el('span', null, m.file.name));
        wrap.appendChild(chip);
      }
      var ub = el('div', 'bubble', m.text);
      ub.setAttribute('dir', 'auto');
      wrap.appendChild(ub);
      var ua = el('div', 'actions');
      ua.appendChild(actBtn('Copy', 'copy', function (b) { copyText(m.text); flash(b, 'Copied', 'Copy'); }));
      ua.appendChild(actBtn('Edit', 'edit', function () { startEdit(idx, wrap); }));
      wrap.appendChild(ua);
      return wrap;
    }

    if (m.kind === 'image') {
      wrap.appendChild(imageCard(m));
      var ia = el('div', 'actions');
      ia.appendChild(actBtn('Download', 'download', function () { downloadImage(m); }));
      if (navigator.share) ia.appendChild(actBtn('Share', 'share', function () { shareImage(m); }));
      if (isLastAi) ia.appendChild(actBtn('Try again', 'redo', regenerate));
      ia.appendChild(actBtn('Report', 'flag', function () { openReport(idx); }));
      wrap.appendChild(ia);
      return wrap;
    }

    var b = el('div', 'bubble');
    b.setAttribute('dir', 'auto');
    if (m.error) b.textContent = m.text; else b.innerHTML = MD.renderMarkdown(m.text);
    wrap.appendChild(b);
    var a = el('div', 'actions');
    if (m.error) {
      a.appendChild(actBtn('Try again', 'redo', regenerate));
    } else {
      a.appendChild(actBtn('Copy', 'copy', function (btn) { copyText(m.text); flash(btn, 'Copied', 'Copy'); }));
      if ('speechSynthesis' in window) a.appendChild(actBtn('Listen', 'speak', function (btn) { toggleSpeak(m.text, btn); }));
      if (isLastAi) a.appendChild(actBtn('Try again', 'redo', regenerate));
      a.appendChild(actBtn('Report', 'flag', function () { openReport(idx); }));
    }
    wrap.appendChild(a);
    return wrap;
  }

  function flash(btn, on, off) {
    var s = btn.querySelector('span');
    s.textContent = on;
    setTimeout(function () { s.textContent = off; }, 1400);
  }

  function imageCard(m) {
    var card = el('div', 'imgcard');
    var frame = el('div', 'frame');
    var img = el('img'); img.alt = m.prompt ? 'Created image: ' + m.prompt.slice(0, 120) : 'Created image';
    img.addEventListener('load', stickIfNeeded);
    frame.appendChild(img);
    card.appendChild(frame);
    Blobs.url(m.imgId).then(function (u) {
      if (u) img.src = u;
      else { img.remove(); frame.appendChild(el('div', 'loading-text', 'This image is no longer stored on this device.')); }
    });
    if (m.prompt) {
      var d = el('details');
      d.appendChild(el('summary', null, 'Prompt used'));
      d.appendChild(el('p', null, m.prompt));
      card.appendChild(d);
    }
    return card;
  }
  function imageFileName(blob) {
    var ext = /png/.test(blob.type) ? 'png' : /webp/.test(blob.type) ? 'webp' : 'jpg';
    return 'anwaar-ai-' + Date.now() + '.' + ext;
  }
  function downloadImage(m) {
    Blobs.get(m.imgId).then(function (b) { if (b) downloadBlob(b, imageFileName(b)); else toast('This image is no longer available.'); });
  }
  function shareImage(m) {
    Blobs.get(m.imgId).then(function (b) {
      if (!b) return toast('This image is no longer available.');
      var f = new File([b], imageFileName(b), { type: b.type || 'image/jpeg' });
      if (navigator.canShare && navigator.canShare({ files: [f] })) {
        navigator.share({ files: [f], title: 'Made with Anwaar AI' }).catch(function () {});
      } else downloadBlob(b, f.name);
    });
  }

  /* ---------- edit a sent message ---------- */
  function startEdit(idx, wrap) {
    if (state.busy) return toast('Wait for the reply to finish, or press stop.');
    var c = cur(), m = c.messages[idx];
    var ed = el('div', 'editor');
    var ta = el('textarea'); ta.value = m.text; ta.setAttribute('dir', 'auto'); ta.setAttribute('aria-label', 'Edit your message');
    var row = el('div', 'btn-row');
    var cancel = el('button', 'btn', 'Cancel'); cancel.type = 'button';
    var ok = el('button', 'btn primary', 'Send'); ok.type = 'button';
    row.appendChild(cancel); row.appendChild(ok);
    ed.appendChild(ta); ed.appendChild(row);
    wrap.innerHTML = '';
    wrap.appendChild(ed);
    ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length);
    cancel.addEventListener('click', renderMessages);
    ok.addEventListener('click', function () {
      var t = ta.value.trim();
      if (!t) return;
      var removed = c.messages.slice(idx + 1);
      c.messages = c.messages.slice(0, idx);
      purge(blobIdsOf(removed));
      var nm = Object.assign({}, m, { text: t, ts: Date.now() });
      delete nm._send;
      c.messages.push(nm);
      if (idx === 0) c.title = titleFrom(t);
      c.ts = Date.now(); save(); renderAll();
      nm.imgreq ? runImage(c, nm) : runChat(c);
    });
  }

  /* ================= sending ================= */

  function setBusy(v) {
    state.busy = v;
    var b = $('#sendBtn');
    b.classList.toggle('stop', v);
    b.setAttribute('aria-label', v ? 'Stop' : 'Send');
  }

  var RX_TECH = /\b(code|script|function|program|app|website|api|class|python|javascript|html|css|sql|resize|compress|convert|upload|download|process|processing|recogni[sz]e|detect|classif\w*|dataset|tutorial)\b/i;
  var RX_EN = /^\s*(?:please\s+|pls\s+|can you\s+|could you\s+|i want you to\s+)?(?:create|make|generate|draw|paint|design|render|produce)\s+(?:me\s+)?(?:an?\s+|the\s+|some\s+)?(?:[\w'-]+\s+){0,3}?(?:image|images|picture|pictures|photo|photos|logo|poster|wallpaper|illustration|thumbnail|banner|portrait|artwork|icon)\b/i;
  var RX_RU = /\b(?:tasveer|tasweer|tasvir|image|photo|logo|poster|wallpaper|thumbnail|picture)\b[^.!?\n]{0,40}?\b(?:bana|banao|banado|bana\s?do|banaiye|banayein|bnao|bnado|bna\s?do|bana\s?dein|generate\s?kar|draw\s?kar)\b/i;
  var RX_UR = /(?:تصویر|تصاویر|فوٹو|لوگو|پوسٹر|وال\s?پیپر)[^.!?\n۔؟]{0,40}?(?:بنا|بناؤ|بنائیں|بنادو|بنوا)/;
  function detectImageIntent(text) {
    var t = String(text || '');
    if (t.length > 400 || RX_TECH.test(t)) return false;
    return RX_EN.test(t) || RX_RU.test(t) || RX_UR.test(t);
  }

  function fullText(m) {
    var t = m.text;
    if (m.file) t += '\n\n[Attached file: ' + m.file.name + (m.file.truncated ? ' (shortened)' : '') + ']\n```\n' + m.file.content + '\n```';
    return t;
  }
  function profile() { return { name: state.prefs.name || '', instructions: state.prefs.instr || '' }; }

  async function onSend() {
    if (state.busy) { if (state.controller) state.controller.abort(); return; }
    var inp = $('#input');
    var text = inp.value.trim();
    var att = state.att;
    if (!text && !att) return;
    if (state.mode === 'image' && att) return toast('Photos cannot be used for image creation yet. Remove it or switch to Chat.');
    var wantsImage = state.mode === 'image' || (!att && detectImageIntent(text));
    if (wantsImage && !text) return;

    stopSpeaking(); stopListening();
    var c = ensureCurrent();
    dropErrors(c);
    var m = { role: 'user', text: text || (att && att.kind === 'file' ? 'Please read this file and summarize it.' : 'Please describe this photo.'), ts: Date.now() };
    if (att && att.kind === 'image') {
      var id = 'u_' + uid();
      var blob = dataUrlToBlob(att.dataUrl);
      if (blob) { Blobs.put(id, blob); m.imgId = id; m._send = att.dataUrl; }
    } else if (att && att.kind === 'file') {
      m.file = { name: att.name, content: att.content, truncated: !!att.truncated };
    }
    if (wantsImage) { m.imgreq = true; m.style = state.style; m.aspect = state.aspect; }

    inp.value = ''; autosize(); clearAtt();
    c.messages.push(m);
    c.ts = Date.now();
    if (!c.title) c.title = titleFrom(m.text);
    c.mode = state.mode;
    save(); renderAll(); scrollDown(true);
    if (wantsImage) runImage(c, m); else runChat(c);
  }

  function regenerate() {
    if (state.busy) return;
    var c = cur();
    if (!c) return;
    dropErrors(c);
    while (c.messages.length && c.messages[c.messages.length - 1].role !== 'user') {
      var last = c.messages[c.messages.length - 1];
      if (last.kind === 'image') break; // keep older pictures; "Try again" adds a new one next to it
      c.messages.pop();
    }
    var lastMsg = c.messages[c.messages.length - 1];
    if (!lastMsg) return;
    var req = lastMsg;
    if (lastMsg.role !== 'user') {
      for (var i = c.messages.length - 1; i >= 0; i--) if (c.messages[i].role === 'user') { req = c.messages[i]; break; }
    }
    save(); renderAll();
    if (req.imgreq) runImage(c, req); else runChat(c);
  }

  function pushError(c, text) {
    c.messages.push({ role: 'assistant', text: text, error: true });
    renderAll(); scrollDown(true);
  }
  function friendlyError(err) {
    var offline = !navigator.onLine || (err && /Failed to fetch|NetworkError|Load failed|network/i.test(err.message || ''));
    return offline ? 'Could not reach the server. Check your internet connection and try again.' : ((err && err.message) || 'Something went wrong. Please try again.');
  }
  async function readError(res) {
    var msg = '';
    try { msg = (await res.json()).error || ''; } catch (e) {}
    return msg || ('The server returned an error (' + res.status + ').');
  }
  var SETUP_MSG = 'The server address is not set yet. Open config.js and put your Worker link in API_URL.';

  async function buildPayload(c) {
    var list = c.messages.filter(function (m) { return !m.error; }).slice(-MAX_SEND), out = [];
    for (var i = 0; i < list.length; i++) {
      var m = list[i];
      if (m.role === 'assistant' && m.kind === 'image') { out.push({ role: 'assistant', text: '[An image was created for the user.]' }); continue; }
      var o = { role: m.role, text: fullText(m) };
      if (m.role === 'user' && i === list.length - 1 && m.imgId) {
        var data = m._send || await Blobs.dataUrl(m.imgId);
        if (data) o.image = data;
      }
      out.push(o);
    }
    return out;
  }

  async function runChat(c) {
    if (!configured()) return pushError(c, SETUP_MSG);
    var box = $('#messages');
    var view = el('div', 'msg ai');
    var bubble = el('div', 'bubble');
    bubble.setAttribute('dir', 'auto');
    bubble.innerHTML = '<span class="typing"><i></i><i></i><i></i></span>';
    view.appendChild(bubble); box.appendChild(view); scrollDown(true);

    state.controller = new AbortController();
    setBusy(true);
    var acc = '', pending = false;
    function paint() { pending = false; bubble.innerHTML = MD.renderMarkdown(acc); scrollDown(false); }

    try {
      var payload = await buildPayload(c);
      var res = await fetch(apiBase() + '/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: state.controller.signal,
        body: JSON.stringify({ mode: 'general', profile: profile(), messages: payload })
      });
      var rem = res.headers.get('X-Remaining');
      if (rem != null) { state.remaining = parseInt(rem, 10); updateHint(); }
      if (!res.ok) throw new Error(await readError(res));

      var reader = res.body.getReader(), dec = new TextDecoder(), buf = '';
      for (;;) {
        var r = await reader.read();
        if (r.done) break;
        buf += dec.decode(r.value, { stream: true });
        var idx;
        while ((idx = buf.indexOf('\n')) >= 0) {
          var line = buf.slice(0, idx).trim(); buf = buf.slice(idx + 1);
          if (line.indexOf('data:') !== 0) continue;
          var data = line.slice(5).trim();
          if (!data || data === '[DONE]') continue;
          try {
            var j = JSON.parse(data);
            var d = j.choices && j.choices[0] && j.choices[0].delta && j.choices[0].delta.content;
            if (d) { acc += d; if (!pending) { pending = true; requestAnimationFrame(paint); } }
          } catch (e) { /* partial line */ }
        }
      }
      paint();
      if (!acc.trim()) throw new Error('The reply came back empty. Please try again.');
      c.messages.push({ role: 'assistant', text: acc, ts: Date.now() });
      c.ts = Date.now(); save(); renderAll();
      if (state.prefs.autoread) speakLast(acc);
    } catch (err) {
      if (err && err.name === 'AbortError') {
        if (acc.trim()) { c.messages.push({ role: 'assistant', text: acc, ts: Date.now() }); save(); }
        renderAll();
      } else {
        if (acc.trim()) c.messages.push({ role: 'assistant', text: acc, ts: Date.now() });
        pushError(c, friendlyError(err));
      }
    } finally { setBusy(false); state.controller = null; }
  }

  var IMG_STEPS = ['Writing a detailed prompt…', 'Painting your image…', 'Adding the final touches…'];

  async function runImage(c, um) {
    if (!configured()) return pushError(c, SETUP_MSG);
    var box = $('#messages');
    var view = el('div', 'msg ai');
    var card = el('div', 'imgcard loading ' + (um.aspect || 'square'));
    var frame = el('div', 'frame');
    var lt = el('div', 'loading-text');
    lt.insertAdjacentHTML('beforeend', ICON.spark);
    var status = el('span', null, IMG_STEPS[0]);
    lt.appendChild(status); frame.appendChild(lt); card.appendChild(frame); view.appendChild(card);
    box.appendChild(view); scrollDown(true);

    var step = 0;
    var ticker = setInterval(function () { step = Math.min(step + 1, IMG_STEPS.length - 1); status.textContent = IMG_STEPS[step]; }, 6000);
    state.controller = new AbortController();
    setBusy(true);

    try {
      var res = await fetch(apiBase() + '/image', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: state.controller.signal,
        body: JSON.stringify({ prompt: um.text, style: um.style || 'auto', aspect: um.aspect || 'square' })
      });
      if (!res.ok) throw new Error(await readError(res));
      var j = await res.json();
      var blob = dataUrlToBlob(j.image);
      if (!blob) throw new Error('The image could not be read. Please try again.');
      if (!j.sized) blob = await cropToAspect(blob, um.aspect || 'square');
      var id = 'g_' + uid();
      await Blobs.put(id, blob);
      c.messages.push({ role: 'assistant', kind: 'image', imgId: id, prompt: j.prompt || '', style: um.style || 'auto', aspect: um.aspect || 'square', ts: Date.now() });
      c.ts = Date.now(); save();
      if (typeof j.remaining === 'number') { state.imgRemaining = j.remaining; updateHint(); }
      renderAll();
    } catch (err) {
      if (err && err.name === 'AbortError') renderAll();
      else pushError(c, friendlyError(err));
    } finally { clearInterval(ticker); setBusy(false); state.controller = null; }
  }

  function updateHint() {
    var h = $('#hint');
    h.textContent = 'Anwaar AI can make mistakes. Check important information.';
    var bits = [];
    if (state.remaining != null && state.remaining >= 0) bits.push(state.remaining + ' messages left today');
    if (state.imgRemaining != null && state.imgRemaining >= 0) bits.push(state.imgRemaining + ' images left today');
    if (bits.length) { var s = el('span', null, bits.join('  ·  ')); s.style.display = 'block'; h.appendChild(s); }
  }

  /* ================= attachments ================= */

  function updateAttPreview() {
    var a = state.att, box = $('#attPreview');
    box.hidden = !a;
    $('#attThumb').hidden = !(a && a.kind === 'image');
    $('#attFile').hidden = !(a && a.kind === 'file');
    if (a && a.kind === 'image') $('#attThumb').src = a.dataUrl;
    if (a && a.kind === 'file') $('#attName').textContent = a.name;
  }
  function clearAtt() { state.att = null; $('#fileInput').value = ''; updateAttPreview(); }

  function handleFile(file) {
    if (!file) return;
    if (state.mode === 'image') return toast('Photos and files cannot be used for image creation. Switch to Chat to attach one.');
    if (/^image\//.test(file.type)) return pickImage(file);
    var isText = /^text\//.test(file.type) || /\.(txt|md|csv|json|xml|log|js|ts|py|html|css|java|c|cpp|sql|ya?ml)$/i.test(file.name);
    if (!isText) return toast('This file type is not supported. Use an image or a text file.');
    if (file.size > MAX_FILE_BYTES) return toast('That file is too large. The limit is 400 KB.');
    var r = new FileReader();
    r.onload = function () {
      var t = String(r.result || '');
      var truncated = t.length > MAX_FILE_CHARS;
      state.att = { kind: 'file', name: file.name, content: t.slice(0, MAX_FILE_CHARS), truncated: truncated };
      updateAttPreview();
      if (truncated) toast('Only the first ' + MAX_FILE_CHARS.toLocaleString('en-US') + ' characters will be used.');
    };
    r.onerror = function () { toast('Could not read that file.'); };
    r.readAsText(file);
  }
  function pickImage(file) {
    loadImage(file).then(function (img) {
      var s = Math.min(1, 1280 / Math.max(img.naturalWidth, img.naturalHeight));
      var cv = document.createElement('canvas');
      cv.width = Math.max(1, Math.round(img.naturalWidth * s)); cv.height = Math.max(1, Math.round(img.naturalHeight * s));
      var ctx = cv.getContext('2d');
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.drawImage(img, 0, 0, cv.width, cv.height);
      state.att = { kind: 'image', dataUrl: cv.toDataURL('image/jpeg', 0.82) };
      updateAttPreview();
    }).catch(function () { toast('Could not open that image.'); });
  }

  /* ================= voice ================= */

  function initMic() {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    var btn = $('#micBtn');
    if (!SR) { btn.hidden = true; return; }
    btn.addEventListener('click', function () {
      if (state.recOn) return stopListening();
      stopSpeaking();
      var rec = new SR();
      rec.lang = state.prefs.vlang || 'ur-PK';
      rec.interimResults = true; rec.continuous = false;
      var inp = $('#input'), base = inp.value ? inp.value.replace(/\s*$/, ' ') : '';
      rec.onresult = function (e) {
        var t = '';
        for (var i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
        inp.value = base + t; autosize();
      };
      rec.onend = function () { state.recOn = false; btn.classList.remove('on'); };
      rec.onerror = function (e) {
        state.recOn = false; btn.classList.remove('on');
        if (e && (e.error === 'not-allowed' || e.error === 'service-not-allowed')) toast('Microphone access was blocked. Allow it in your browser settings.');
        else if (e && e.error === 'no-speech') toast('I did not hear anything. Try again.');
      };
      try { rec.start(); state.rec = rec; state.recOn = true; btn.classList.add('on'); } catch (e) { state.recOn = false; }
    });
  }
  function stopListening() {
    if (state.rec && state.recOn) { try { state.rec.stop(); } catch (e) {} }
    state.recOn = false;
    $('#micBtn').classList.remove('on');
  }

  function stopSpeaking() {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if (state.speakingEl) { state.speakingEl.classList.remove('on'); state.speakingEl = null; }
  }
  function speak(text, btn) {
    var plain = MD.toPlain(text);
    if (!plain) return;
    var arabic = hasArabicScript(plain);
    var pv = state.prefs.vlang || 'ur-PK';
    var lang = arabic ? (pv === 'ar-SA' ? 'ar-SA' : 'ur-PK') : 'en-US';
    var voices = window.speechSynthesis.getVoices() || [];
    var voice = voices.find(function (v) { return v.lang && v.lang.toLowerCase().replace('_', '-').indexOf(lang.slice(0, 2)) === 0; });
    var chunks = plain.match(/[^.!?۔؟\n]+[.!?۔؟\n]*/g) || [plain], parts = [], buf = '';
    chunks.forEach(function (c) { if ((buf + c).length > 180) { if (buf) parts.push(buf); buf = c; } else buf += c; });
    if (buf) parts.push(buf);
    if (btn) { btn.classList.add('on'); state.speakingEl = btn; }
    parts.forEach(function (p, i) {
      var u = new SpeechSynthesisUtterance(p.trim());
      u.lang = lang; if (voice) u.voice = voice;
      if (i === parts.length - 1) u.onend = function () { if (btn && state.speakingEl === btn) stopSpeaking(); };
      u.onerror = function () { if (btn && state.speakingEl === btn) stopSpeaking(); };
      window.speechSynthesis.speak(u);
    });
  }
  function toggleSpeak(text, btn) {
    if (!('speechSynthesis' in window)) return;
    if (state.speakingEl === btn) return stopSpeaking();
    stopSpeaking(); speak(text, btn);
  }
  function speakLast(text) { if ('speechSynthesis' in window) { stopSpeaking(); speak(text, null); } }

  /* ================= report ================= */

  function openReport(idx) {
    state.reportIdx = idx;
    $('#repReason').value = '';
    var d = $('#reportDlg');
    if (d.showModal) d.showModal(); else d.setAttribute('open', '');
  }
  async function sendReport() {
    var c = cur(), m = c && c.messages[state.reportIdx];
    if (!m) return $('#reportDlg').close();
    var q = '';
    for (var i = state.reportIdx - 1; i >= 0; i--) if (c.messages[i].role === 'user') { q = c.messages[i].text; break; }
    var btn = $('#repSend'); btn.disabled = true;
    try {
      var res = await fetch(apiBase() + '/report', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: m.kind === 'image' ? 'image' : 'chat', mode: normMode(c.mode), reason: $('#repReason').value.trim(), question: q, reply: m.kind === 'image' ? (m.prompt || '[image]') : m.text })
      });
      if (!res.ok) throw new Error(await readError(res));
      $('#reportDlg').close();
      toast('Thank you. Your report was sent.');
    } catch (e) {
      toast(e && e.message && !/fetch|network/i.test(e.message) ? e.message : 'Could not send the report. Please try again.');
    } finally { btn.disabled = false; }
  }

  /* ================= settings ================= */

  function syncSettingsUI() {
    $$('#settings .seg[data-pref]').forEach(function (seg) {
      var k = seg.dataset.pref;
      $$('button', seg).forEach(function (b) { b.setAttribute('aria-checked', String(state.prefs[k]) === b.dataset.v ? 'true' : 'false'); });
    });
    $$('#settings input.toggle').forEach(function (t) { t.checked = !!state.prefs[t.dataset.pref]; });
    $('#prefName').value = state.prefs.name || '';
    $('#prefInstr').value = state.prefs.instr || '';
  }
  function initSettings() {
    $$('#settings .seg[data-pref]').forEach(function (seg) {
      seg.addEventListener('click', function (e) {
        var b = e.target.closest('button[data-v]');
        if (!b) return;
        setPref(seg.dataset.pref, b.dataset.v);
        syncSettingsUI();
      });
    });
    $$('#settings input.toggle').forEach(function (t) {
      t.addEventListener('change', function () { setPref(t.dataset.pref, t.checked); });
    });
    $('#prefName').addEventListener('input', function (e) { setPref('name', e.target.value.slice(0, 60)); });
    $('#prefInstr').addEventListener('input', function (e) { setPref('instr', e.target.value.slice(0, 600)); });

    $('#openSettings').addEventListener('click', function () {
      syncSettingsUI(); openMenu(false);
      var d = $('#settings'); if (d.showModal) d.showModal(); else d.setAttribute('open', '');
    });
    ['settings', 'reportDlg'].forEach(function (id) {
      var d = document.getElementById(id);
      d.addEventListener('click', function (e) { if (e.target === d) d.close(); });
    });

    $('#exportAll').addEventListener('click', function () {
      var data = state.chats.filter(nonEmpty).map(function (c) {
        return { title: c.title, mode: c.mode, updated: new Date(c.ts).toISOString(), messages: c.messages.filter(function (m) { return !m.error; }).map(function (m) {
          return { role: m.role, text: m.kind === 'image' ? '[Image] ' + (m.prompt || '') : m.text };
        }) };
      });
      if (!data.length) return toast('There are no chats to export.');
      downloadBlob(new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), chats: data }, null, 2)], { type: 'application/json' }), 'anwaar-ai-chats.json');
    });
    $('#clearAll').addEventListener('click', function () {
      if (!state.chats.some(nonEmpty)) return toast('There are no chats to delete.');
      if (!window.confirm('Delete all chats from this device? This cannot be undone.')) return;
      state.chats = []; state.currentId = null;
      Blobs.clear(); save(); ensureCurrent(); renderAll();
      $('#settings').close();
      toast('All chats deleted.');
    });
  }

  /* ================= composer + page ================= */

  function autosize() {
    var t = $('#input');
    t.style.height = 'auto';
    t.style.height = Math.min(t.scrollHeight, 170) + 'px';
  }
  function updateToBottom() {
    var m = $('#messages');
    $('#toBottom').hidden = m.scrollHeight - m.scrollTop - m.clientHeight < 240;
  }
  function closeMoreMenu() { $('#moreMenu').hidden = true; $('#moreBtn').setAttribute('aria-expanded', 'false'); }

  function init() {
    loadPrefs(); applyPrefs();
    loadChats();
    var first = state.chats.filter(nonEmpty)[0];
    if (first) { state.currentId = first.id; state.mode = normMode(first.mode); }
    ensureCurrent();

    initSettings(); initMic();

    $('#menuBtn').addEventListener('click', function () { openMenu(true); });
    $('#sbClose').addEventListener('click', function () { openMenu(false); });
    $('#scrim').addEventListener('click', function () { openMenu(false); });
    $('#newChat').addEventListener('click', newChat);
    $('#search').addEventListener('input', function (e) { state.search = e.target.value; renderSidebar(); });
    $('#themeBtn').addEventListener('click', function () { setPref('theme', effectiveTheme() === 'dark' ? 'light' : 'dark'); });
    if (window.matchMedia) {
      var mq = window.matchMedia('(prefers-color-scheme: light)');
      var onChange = function () { if (state.prefs.theme === 'system') applyPrefs(); };
      if (mq.addEventListener) mq.addEventListener('change', onChange);
    }

    $('#moreBtn').addEventListener('click', function (e) {
      e.stopPropagation();
      var menu = $('#moreMenu'), open = menu.hidden;
      menu.hidden = !open;
      $('#moreBtn').setAttribute('aria-expanded', String(open));
      var share = $('[data-act="share"]', menu); if (share) share.hidden = !navigator.share;
    });
    $('#moreMenu').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-act]');
      if (!b) return;
      closeMoreMenu(); chatMenuAction(b.dataset.act);
    });
    document.addEventListener('click', function (e) { if (!e.target.closest('#moreMenu') && !e.target.closest('#moreBtn')) closeMoreMenu(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeMoreMenu(); openMenu(false); } });

    $('#sendBtn').addEventListener('click', onSend);
    var input = $('#input');
    input.maxLength = 4000;
    input.addEventListener('input', autosize);
    input.addEventListener('keydown', function (e) {
      var desktop = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && desktop) { e.preventDefault(); onSend(); }
    });
    input.addEventListener('paste', function (e) {
      var items = (e.clipboardData && e.clipboardData.items) || [];
      for (var i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image/') === 0) { handleFile(items[i].getAsFile()); e.preventDefault(); break; }
      }
    });
    $('#attachBtn').addEventListener('click', function () {
      if (state.mode === 'image') return toast('Switch to Chat to attach a photo or file.');
      $('#fileInput').click();
    });
    $('#fileInput').addEventListener('change', function (e) { handleFile(e.target.files[0]); });
    $('#attRemove').addEventListener('click', clearAtt);

    var main = $('.main');
    main.addEventListener('dragover', function (e) { e.preventDefault(); });
    main.addEventListener('drop', function (e) {
      e.preventDefault();
      var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) handleFile(f);
    });

    var msgs = $('#messages');
    msgs.addEventListener('scroll', updateToBottom, { passive: true });
    $('#toBottom').addEventListener('click', function () { msgs.scrollTop = msgs.scrollHeight; });
    if (window.ResizeObserver) {
      // keep the scroll-down button just above the message box, whatever its height
      new ResizeObserver(function () {
        $('#toBottom').style.bottom = ($('.composer').offsetHeight + 12) + 'px';
        updateToBottom();
      }).observe($('.composer'));
    }
    msgs.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('.copy-code');
      if (!b) return;
      var code = b.parentNode.querySelector('code');
      if (code) { copyText(code.textContent); b.textContent = 'Copied'; setTimeout(function () { b.textContent = 'Copy'; }, 1300); }
    });

    $('#repCancel').addEventListener('click', function () { $('#reportDlg').close(); });
    $('#repSend').addEventListener('click', sendReport);

    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault(); state.installEvt = e; $('#installBtn').hidden = false;
    });
    $('#installBtn').addEventListener('click', function () {
      var ev = state.installEvt; if (!ev) return;
      ev.prompt();
      ev.userChoice.then(function () { state.installEvt = null; $('#installBtn').hidden = true; });
    });
    window.addEventListener('appinstalled', function () { $('#installBtn').hidden = true; });

    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    }
    if ('speechSynthesis' in window) window.speechSynthesis.getVoices();
    window.addEventListener('beforeunload', function () { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); });

    updateHint();
    renderAll();
  }

  window.AnwaarApp = { detectImageIntent: detectImageIntent };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
