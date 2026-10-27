/* Anwaar AI — front-end (no framework, no build step). */
(function () {
  'use strict';

  var CFG = window.ANWAAR_CONFIG || {};
  var MD = window.AnwaarMD;
  var $ = function (s, r) { return (r || document).querySelector(s); };

  var KEY_CHATS = 'anwaar_ai_chats_v1';
  var KEY_THEME = 'anwaar_ai_theme';
  var KEY_VLANG = 'anwaar_ai_vlang';
  var MAX_CHATS = 40;
  var MAX_SEND = 20; // messages of context sent to server

  var MODES = [
    { id: 'general', label: 'General', title: 'General', sub: 'Ask anything',
      starter: '' },
    { id: 'islamic', label: 'Islamic', title: 'Islamic questions', sub: 'Quran, Hadith, rulings',
      starter: 'If a mistake happens in prayer, when is Sajda Sahw wajib?' },
    { id: 'cv', label: 'CV / Application', title: 'CV and applications', sub: 'CV, application, cover letter',
      starter: 'Make my CV. Name: \nEducation: \nExperience: \nSkills: ' },
    { id: 'writer', label: 'Writing', title: 'Writing', sub: 'Email, essay, letter',
      starter: 'Write an excellent essay on this topic: ' },
    { id: 'cyber', label: 'Cyber Security', title: 'Cyber Security', sub: 'Learn ethical hacking',
      starter: 'How can I stay safe from phishing? Explain in simple words.' },
    { id: 'youtube', label: 'YouTube', title: 'YouTube Creator', sub: 'Script, title, tags, Shorts',
      starter: 'Write an 8-minute YouTube script on this topic: ' },
    { id: 'apps', label: 'Anwaar Apps', title: 'Anwaar Digital Apps', sub: 'Apps and downloads',
      starter: 'What apps does Anwaar Digital offer?' }
  ];

  var state = {
    chats: [],
    currentId: null,
    mode: 'general',
    image: null,        // data URL of the picked image
    busy: false,
    controller: null,
    speakingEl: null,
    rec: null,
    recOn: false,
    remaining: null
  };

  /* ---------- storage ---------- */
  function load() {
    try { state.chats = JSON.parse(localStorage.getItem(KEY_CHATS) || '[]') || []; }
    catch (e) { state.chats = []; }
    if (!Array.isArray(state.chats)) state.chats = [];
  }
  function nonEmpty(c) { return c && c.messages && c.messages.length > 0; }
  function save() {
    try {
      state.chats.sort(function (a, b) { return b.ts - a.ts; });
      state.chats = state.chats.slice(0, MAX_CHATS);
      // empty chats and picture data are never written to storage
      localStorage.setItem(KEY_CHATS, JSON.stringify(state.chats.filter(nonEmpty), function (k, v) {
        return (k === 'imgData' || k === '_send') ? undefined : v;
      }));
    } catch (e) { /* storage full or blocked: chat still works in memory */ }
  }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function cur() { return state.chats.find(function (c) { return c.id === state.currentId; }); }

  /* ---------- helpers ---------- */
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  var ICON = {
    copy: '<svg viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V6.5A2.5 2.5 0 0 0 13.5 4h-7A2.5 2.5 0 0 0 4 6.5v7A2.5 2.5 0 0 0 6.5 16H8"/></svg>',
    speak: '<svg viewBox="0 0 24 24"><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5zM15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/></svg>',
    redo: '<svg viewBox="0 0 24 24"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/></svg>',
    del: '<svg viewBox="0 0 24 24" style="width:16px;height:16px"><path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12"/></svg>'
  };
  function hasArabicScript(t) { return /[؀-ۿ]/.test(t); }
  function scrollDown(force) {
    var m = $('#messages');
    var near = m.scrollHeight - m.scrollTop - m.clientHeight < 160;
    if (force || near) m.scrollTop = m.scrollHeight;
  }

  /* ---------- theme ---------- */
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'dark' ? '#0b2016' : '#eef3ef');
  }
  function initTheme() {
    var t = null;
    try { t = localStorage.getItem(KEY_THEME); } catch (e) {}
    if (!t) t = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    applyTheme(t);
    $('#themeBtn').addEventListener('click', function () {
      var n = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(n);
      try { localStorage.setItem(KEY_THEME, n); } catch (e) {}
    });
  }

  /* ---------- sidebar ---------- */
  function openMenu(v) { $('#app').classList.toggle('menu-open', v); }

  function renderSidebar() {
    var list = $('#chatList');
    list.innerHTML = '';
    var shown = state.chats.filter(nonEmpty);
    if (!shown.length) {
      list.appendChild(el('div', 'chat-empty', 'No chats yet.'));
      return;
    }
    shown.forEach(function (c) {
      var row = el('div', 'chat-item' + (c.id === state.currentId ? ' active' : ''));
      row.setAttribute('role', 'listitem');
      var t = el('button', 't', c.title || 'New chat');
      t.type = 'button';
      t.setAttribute('dir', 'auto');
      t.addEventListener('click', function () { openChat(c.id); openMenu(false); });
      var d = el('button', 'del');
      d.type = 'button';
      d.setAttribute('aria-label', 'Delete chat');
      d.innerHTML = ICON.del;
      d.addEventListener('click', function (e) { e.stopPropagation(); deleteChat(c.id); });
      row.appendChild(t); row.appendChild(d);
      list.appendChild(row);
    });
  }

  function deleteChat(id) {
    state.chats = state.chats.filter(function (c) { return c.id !== id; });
    save();
    if (state.currentId === id) newChat(); else renderSidebar();
  }

  /* ---------- modes ---------- */
  function renderModes() {
    var box = $('#modes');
    box.innerHTML = '';
    MODES.forEach(function (m) {
      var b = el('button', 'mode' + (m.id === state.mode ? ' active' : ''), m.label);
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', m.id === state.mode ? 'true' : 'false');
      b.addEventListener('click', function () { setMode(m.id); });
      box.appendChild(b);
    });
  }
  function setMode(id) {
    state.mode = id;
    var c = cur();
    if (c) { c.mode = id; save(); }
    renderModes();
  }

  /* ---------- chats ---------- */
  function newChat() {
    stopSpeaking();
    var existing = cur();
    if (!existing || nonEmpty(existing)) {
      var c = { id: uid(), title: '', mode: state.mode, ts: Date.now(), messages: [] };
      state.chats.unshift(c);
      state.currentId = c.id;
    }
    // an empty chat is reused, and never saved until the first message
    renderAll();
    openMenu(false);
    $('#input').focus();
  }
  function openChat(id) {
    stopSpeaking();
    state.currentId = id;
    var c = cur();
    if (c && c.mode) state.mode = c.mode;
    renderAll();
  }
  function renderAll() {
    renderSidebar();
    renderModes();
    renderMessages();
    var c = cur();
    $('#topTitle').textContent = (c && c.title) || 'Anwaar AI';
  }

  function renderMessages() {
    var box = $('#messages');
    box.innerHTML = '';
    var c = cur();
    if (!c || !c.messages.length) { box.appendChild(welcomeView()); return; }
    c.messages.forEach(function (m, i) { box.appendChild(messageView(m, i === c.messages.length - 1)); });
    scrollDown(true);
  }

  function welcomeView() {
    var w = el('div', 'welcome');
    w.appendChild(el('h1', 'hello', 'Peace be upon you!'));
    w.appendChild(el('p', 'sub', 'I am Anwaar AI. Ask in English, Urdu or Roman Urdu, and I will answer in the same language.'));
    var grid = el('div', 'cards');
    MODES.filter(function (m) { return m.id !== 'general'; }).forEach(function (m) {
      var b = el('button', 'card');
      b.type = 'button';
      var t = el('b', null, m.title); t.setAttribute('dir', 'auto');
      b.appendChild(t);
      b.appendChild(el('span', null, m.sub));
      b.addEventListener('click', function () {
        setMode(m.id);
        var inp = $('#input');
        inp.value = m.starter;
        autosize();
        inp.focus();
        inp.setSelectionRange(inp.value.length, inp.value.length);
      });
      grid.appendChild(b);
    });
    w.appendChild(grid);
    return w;
  }

  function messageView(m, isLast) {
    var wrap = el('div', 'msg ' + (m.role === 'user' ? 'user' : 'ai') + (m.error ? ' err' : ''));
    if (m.role === 'user' && m.img) {
      var im = el('img', 'attached');
      if (m.imgData) im.src = m.imgData; else im.alt = '[tasveer]';
      if (m.imgData) wrap.appendChild(im);
    }
    var b = el('div', 'bubble');
    b.setAttribute('dir', 'auto');
    if (m.role === 'user') b.textContent = (m.img && !m.imgData ? '📷 ' : '') + m.text;
    else b.innerHTML = MD.renderMarkdown(m.text);
    wrap.appendChild(b);
    if (m.role !== 'user' && !m.error) wrap.appendChild(actionsView(m, isLast));
    wrap._bubble = b;
    return wrap;
  }

  function actionsView(m, isLast) {
    var a = el('div', 'actions');
    var copy = el('button'); copy.type = 'button'; copy.innerHTML = ICON.copy + '<span>Copy</span>';
    copy.addEventListener('click', function () {
      copyText(m.text);
      copy.querySelector('span').textContent = 'Copied';
      setTimeout(function () { copy.querySelector('span').textContent = 'Copy'; }, 1400);
    });
    a.appendChild(copy);
    if ('speechSynthesis' in window) {
      var sp = el('button'); sp.type = 'button'; sp.innerHTML = ICON.speak + '<span>Listen</span>';
      sp.addEventListener('click', function () { toggleSpeak(m.text, sp); });
      a.appendChild(sp);
    }
    if (isLast) {
      var rg = el('button'); rg.type = 'button'; rg.innerHTML = ICON.redo + '<span>Retry</span>';
      rg.addEventListener('click', regenerate);
      a.appendChild(rg);
    }
    return a;
  }

  function copyText(t) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(t).catch(function () { fallbackCopy(t); });
    } else fallbackCopy(t);
  }
  function fallbackCopy(t) {
    var ta = document.createElement('textarea');
    ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
  }

  /* ---------- sending ---------- */
  function setBusy(v) {
    state.busy = v;
    var b = $('#sendBtn');
    b.classList.toggle('stop', v);
    b.setAttribute('aria-label', v ? 'Stop' : 'Send');
  }

  function titleFrom(text) {
    var t = text.replace(/\s+/g, ' ').trim();
    return t.length > 42 ? t.slice(0, 42) + '…' : t || 'New chat';
  }

  function onSendClick() {
    if (state.busy) { if (state.controller) state.controller.abort(); return; }
    var inp = $('#input');
    var text = inp.value.trim();
    if (!text && !state.image) return;
    if (!text && state.image) text = 'Tell me about this picture.';
    inp.value = '';
    autosize();
    stopListening();
    stopSpeaking();

    var c = cur();
    if (!c) { newChat(); c = cur(); }
    var msg = { role: 'user', text: text };
    if (state.image) { msg.img = true; msg.imgData = state.image; msg._send = state.image; }
    c.messages.push(msg);
    c.mode = state.mode;
    c.ts = Date.now();
    if (!c.title) c.title = titleFrom(text);
    clearImage();
    save();
    renderAll();
    askAI();
  }

  function buildPayload(c) {
    var msgs = c.messages.filter(function (m) { return !m.error; }).slice(-MAX_SEND);
    return msgs.map(function (m, i) {
      var o = { role: m.role, text: m.text };
      if (m.role === 'user' && m._send && i === msgs.length - 1) o.image = m._send;
      return o;
    });
  }

  async function askAI() {
    var c = cur();
    var box = $('#messages');

    if (!CFG.API_URL || CFG.API_URL.indexOf('YOUR-SUBDOMAIN') !== -1) {
      pushError(c, 'Server link is not set yet. Open config.js and enter your Worker link in API_URL.');
      return;
    }

    var aiMsg = { role: 'assistant', text: '' };
    var view = messageView(aiMsg, false);
    view._bubble.innerHTML = '<span class="typing"><i></i><i></i><i></i></span>';
    box.appendChild(view);
    scrollDown(true);

    state.controller = new AbortController();
    setBusy(true);

    var acc = '';
    var pending = false;
    function paint() {
      pending = false;
      view._bubble.innerHTML = MD.renderMarkdown(acc);
      scrollDown(false);
    }

    try {
      var res = await fetch(CFG.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: c.mode || 'general', messages: buildPayload(c) }),
        signal: state.controller.signal
      });
      var rem = res.headers.get('X-Remaining');
      if (rem != null) { state.remaining = parseInt(rem, 10); updateHint(); }

      if (!res.ok) {
        var emsg = '';
        try { emsg = (await res.json()).error || ''; } catch (e) {}
        throw new Error(emsg || ('Server error (' + res.status + ')'));
      }

      var reader = res.body.getReader();
      var dec = new TextDecoder();
      var buf = '';
      for (;;) {
        var r = await reader.read();
        if (r.done) break;
        buf += dec.decode(r.value, { stream: true });
        var idx;
        while ((idx = buf.indexOf('\n')) >= 0) {
          var line = buf.slice(0, idx).trim();
          buf = buf.slice(idx + 1);
          if (line.indexOf('data:') !== 0) continue;
          var data = line.slice(5).trim();
          if (!data || data === '[DONE]') continue;
          try {
            var j = JSON.parse(data);
            var d = j.choices && j.choices[0] && j.choices[0].delta && j.choices[0].delta.content;
            if (d) {
              acc += d;
              if (!pending) { pending = true; requestAnimationFrame(paint); }
            }
          } catch (e) { /* partial JSON line, ignore */ }
        }
      }
      paint();
      if (!acc.trim()) throw new Error('Empty reply received. Please try again.');
      aiMsg.text = acc;
      c.messages.push(aiMsg);
      c.ts = Date.now();
      save();
      renderAll();
    } catch (err) {
      if (err && err.name === 'AbortError') {
        if (acc.trim()) { aiMsg.text = acc; c.messages.push(aiMsg); save(); }
        renderAll();
      } else {
        if (acc.trim()) { aiMsg.text = acc; c.messages.push(aiMsg); }
        var offline = !navigator.onLine || (err && /Failed to fetch|NetworkError|Load failed/i.test(err.message));
        pushError(c, offline ? 'Could not reach the internet or server. Check your connection and try again.' : (err.message || 'Something went wrong.'));
      }
    } finally {
      setBusy(false);
      state.controller = null;
    }
  }

  function pushError(c, text) {
    c.messages.push({ role: 'assistant', text: text, error: true });
    renderAll();
    scrollDown(true);
  }

  function regenerate() {
    if (state.busy) return;
    var c = cur();
    if (!c) return;
    while (c.messages.length && c.messages[c.messages.length - 1].role !== 'user') c.messages.pop();
    if (!c.messages.length) return;
    renderAll();
    askAI();
  }

  function updateHint() {
    var h = $('#hint');
    var base = 'AI can make mistakes. Verify important things yourself.';
    h.textContent = base;
    if (state.remaining != null && state.remaining >= 0) {
      var s = el('span', null, 'Remaining messages today: ' + state.remaining);
      s.style.display = 'block';
      h.appendChild(s);
    }
  }

  /* ---------- image ---------- */
  function pickImage(file) {
    if (!file || !/^image\//.test(file.type)) return;
    var url = URL.createObjectURL(file);
    var img = new Image();
    img.onload = function () {
      var max = 1280;
      var s = Math.min(1, max / Math.max(img.width, img.height));
      var cv = document.createElement('canvas');
      cv.width = Math.round(img.width * s);
      cv.height = Math.round(img.height * s);
      var ctx = cv.getContext('2d');
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.drawImage(img, 0, 0, cv.width, cv.height);
      state.image = cv.toDataURL('image/jpeg', 0.82);
      URL.revokeObjectURL(url);
      $('#imgThumb').src = state.image;
      $('#imgPreview').hidden = false;
    };
    img.onerror = function () { URL.revokeObjectURL(url); };
    img.src = url;
  }
  function clearImage() {
    state.image = null;
    $('#imgPreview').hidden = true;
    $('#imgThumb').removeAttribute('src');
    $('#fileInput').value = '';
  }

  /* ---------- voice input ---------- */
  var VLANGS = [{ code: 'ur-PK', label: 'Urdu' }, { code: 'en-US', label: 'English' }];
  var vlang = 0;
  function initVoiceLang() {
    try { vlang = Math.max(0, VLANGS.findIndex(function (v) { return v.code === localStorage.getItem(KEY_VLANG); })); } catch (e) {}
    var b = $('#voiceLang');
    b.textContent = VLANGS[vlang].label;
    b.addEventListener('click', function () {
      vlang = (vlang + 1) % VLANGS.length;
      b.textContent = VLANGS[vlang].label;
      try { localStorage.setItem(KEY_VLANG, VLANGS[vlang].code); } catch (e) {}
      if (state.recOn) { stopListening(); }
    });
  }

  function initMic() {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    var btn = $('#micBtn');
    if (!SR) { btn.style.display = 'none'; $('#voiceLang').style.display = 'none'; return; }
    btn.addEventListener('click', function () {
      if (state.recOn) { stopListening(); return; }
      stopSpeaking();
      var rec = new SR();
      rec.lang = VLANGS[vlang].code;
      rec.interimResults = true;
      rec.continuous = false;
      var inp = $('#input');
      var base = inp.value ? inp.value.replace(/\s*$/, ' ') : '';
      rec.onresult = function (e) {
        var t = '';
        for (var i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
        inp.value = base + t;
        autosize();
      };
      rec.onend = function () { state.recOn = false; btn.classList.remove('on'); };
      rec.onerror = function (e) {
        state.recOn = false; btn.classList.remove('on');
        if (e && (e.error === 'not-allowed' || e.error === 'service-not-allowed')) {
          alert('Microphone ki ijazat nahi mili. Browser settings mein microphone allow karein.');
        }
      };
      try { rec.start(); state.rec = rec; state.recOn = true; btn.classList.add('on'); }
      catch (e) { state.recOn = false; }
    });
  }
  function stopListening() {
    if (state.rec && state.recOn) { try { state.rec.stop(); } catch (e) {} }
    state.recOn = false;
    $('#micBtn').classList.remove('on');
  }

  /* ---------- voice output ---------- */
  function stopSpeaking() {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if (state.speakingEl) { state.speakingEl.classList.remove('on'); state.speakingEl = null; }
  }
  function toggleSpeak(text, btn) {
    if (!('speechSynthesis' in window)) return;
    if (state.speakingEl === btn) { stopSpeaking(); return; }
    stopSpeaking();
    var plain = MD.toPlain(text);
    if (!plain) return;
    var lang = hasArabicScript(plain) ? 'ur-PK' : 'en-US';
    var voices = window.speechSynthesis.getVoices() || [];
    var voice = voices.find(function (v) { return v.lang && v.lang.toLowerCase().indexOf(lang.slice(0, 2)) === 0; });
    // Chrome on Android stops long utterances: speak in chunks
    var chunks = plain.match(/[^.!?۔؟\n]+[.!?۔؟\n]*/g) || [plain];
    var parts = [], cur2 = '';
    chunks.forEach(function (c) {
      if ((cur2 + c).length > 180) { if (cur2) parts.push(cur2); cur2 = c; } else cur2 += c;
    });
    if (cur2) parts.push(cur2);
    btn.classList.add('on');
    state.speakingEl = btn;
    parts.forEach(function (p, i) {
      var u = new SpeechSynthesisUtterance(p.trim());
      u.lang = lang;
      if (voice) u.voice = voice;
      if (i === parts.length - 1) u.onend = function () { if (state.speakingEl === btn) stopSpeaking(); };
      u.onerror = function () { if (state.speakingEl === btn) stopSpeaking(); };
      window.speechSynthesis.speak(u);
    });
  }

  /* ---------- composer ---------- */
  function autosize() {
    var t = $('#input');
    t.style.height = 'auto';
    t.style.height = Math.min(t.scrollHeight, 170) + 'px';
  }

  function init() {
    load();
    // drop empty chats left over from a previous visit
    state.chats = state.chats.filter(function (c) { return c.messages && c.messages.length; });
    initTheme();
    initVoiceLang();
    initMic();

    $('#menuBtn').addEventListener('click', function () { openMenu(true); });
    $('#sbClose').addEventListener('click', function () { openMenu(false); });
    $('#scrim').addEventListener('click', function () { openMenu(false); });
    $('#newChat').addEventListener('click', newChat);
    $('#clearAll').addEventListener('click', function () {
      if (!state.chats.length) return;
      if (confirm('All chats will be deleted permanently. Are you sure you want to delete them?')) {
        state.chats = []; save(); newChat();
      }
    });

    $('#sendBtn').addEventListener('click', onSendClick);
    $('#input').addEventListener('input', autosize);
    $('#input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && window.matchMedia('(min-width: 900px)').matches) {
        e.preventDefault(); onSendClick();
      }
    });
    $('#attachBtn').addEventListener('click', function () { $('#fileInput').click(); });
    $('#fileInput').addEventListener('change', function (e) { pickImage(e.target.files[0]); });
    $('#imgRemove').addEventListener('click', clearImage);
    $('#input').addEventListener('paste', function (e) {
      var items = (e.clipboardData && e.clipboardData.items) || [];
      for (var i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image/') === 0) { pickImage(items[i].getAsFile()); e.preventDefault(); break; }
      }
    });

    // copy buttons inside code blocks
    $('#messages').addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('.copy-code');
      if (!b) return;
      var code = b.parentNode.querySelector('code');
      if (code) { copyText(code.textContent); b.textContent = 'Copied'; setTimeout(function () { b.textContent = 'Copy'; }, 1300); }
    });

    if ('speechSynthesis' in window) window.speechSynthesis.getVoices(); // warm up voice list

    if (state.chats.length) { state.currentId = state.chats[0].id; state.mode = state.chats[0].mode || 'general'; }
    else {
      var c = { id: uid(), title: '', mode: 'general', ts: Date.now(), messages: [] };
      state.chats.unshift(c); state.currentId = c.id;
    }
    renderAll();
    updateHint();
  }

  window.addEventListener('beforeunload', function () { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
