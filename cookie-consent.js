/* Cookie consent + consent-gated Google Analytics (GDPR) */
(function () {
  'use strict';
  var GA_ID = 'G-T6WVGJVD4J';
  var KEY = 'ad_cookie_consent_v1';

  function loadGA() {
    if (window.__gaLoaded) return;
    window.__gaLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    window.gtag('js', new Date());
    window.gtag('config', GA_ID);
  }

  function hideBanner() {
    var b = document.getElementById('adCookieBanner');
    if (b && b.parentNode) b.parentNode.removeChild(b);
  }

  function showBanner() {
    if (document.getElementById('adCookieBanner')) return;
    if (!document.body) return;
    var b = document.createElement('div');
    b.id = 'adCookieBanner';
    b.setAttribute('role', 'dialog');
    b.setAttribute('aria-label', 'Cookie consent');
    b.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:99999;' +
      'background:#0d2818;color:#ffffff;padding:14px 18px;display:flex;flex-wrap:wrap;' +
      'gap:12px;align-items:center;justify-content:center;font-size:14px;line-height:1.5;' +
      'box-shadow:0 -2px 18px rgba(0,0,0,.35);font-family:inherit';
    var cookieEmoji = String.fromCharCode(0xD83C, 0xDF6A);
    b.innerHTML =
      '<span style="max-width:640px">' + cookieEmoji + ' We use cookies for analytics (Google Analytics) ' +
      'to understand visits and improve our website. Accept to allow analytics cookies, or decline.</span>' +
      '<span style="display:flex;gap:10px;flex-wrap:wrap">' +
      '<button type="button" id="adCookieAccept" style="background:#d4af37;color:#0A3D2E;border:0;' +
      'border-radius:20px;padding:9px 28px;font-weight:700;cursor:pointer;font-size:14px">Accept</button>' +
      '<button type="button" id="adCookieDecline" style="background:transparent;color:#ffffff;' +
      'border:1px solid #ffffff;border-radius:20px;padding:9px 24px;cursor:pointer;font-size:14px">Decline</button>' +
      '</span>';
    document.body.appendChild(b);
    document.getElementById('adCookieAccept').onclick = function () {
      try { localStorage.setItem(KEY, 'accepted'); } catch (e) {}
      hideBanner(); loadGA(); placeFloats();
    };
    document.getElementById('adCookieDecline').onclick = function () {
      try { localStorage.setItem(KEY, 'declined'); } catch (e) {}
      hideBanner(); placeFloats();
    };
  }

  function init() {
    var c = null;
    try { c = localStorage.getItem(KEY); } catch (e) {}
    if (c === 'accepted') { loadGA(); return; }
    if (c === 'declined') return;
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', showBanner);
    } else {
      showBanner();
    }
  }

  init();

  /* Floating-button stack (2026-11-05): AI, WhatsApp and back-to-top must never cover each other,
     and must sit above the cookie banner while it is visible. Base = banner height + 16, else 16.
     The AI button is created here because the main site's shared script is this file. */
  function placeFloats() {
    var b = document.getElementById('adCookieBanner');
    var base = (b ? b.offsetHeight : 0) + 16;
    var ai = document.getElementById('anwaar-ai-btn');
    if (ai) { ai.style.bottom = base + 'px'; ai.style.right = '16px'; }
    var wa = document.querySelector('.wa-float');
    if (wa) { wa.style.bottom = (base + 60) + 'px'; wa.style.right = '16px'; }
    var tp = document.getElementById('backToTop');
    if (tp) { tp.style.bottom = (base + 132) + 'px'; tp.style.right = '16px'; }
  }

  function addAiButton() {
    if (document.getElementById('anwaar-ai-btn')) return;
    if (!document.body) return;
    var a = document.createElement('a');
    a.id = 'anwaar-ai-btn';
    a.href = 'https://anwaardigital.com/ai/?site=main';
    a.target = '_blank';
    a.rel = 'noopener';
    a.setAttribute('aria-label', 'Anwaar AI');
    a.textContent = '\u2726 Anwaar AI';
    a.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:9999;display:flex;align-items:center;background:#1a2b4a;color:#fff;text-decoration:none;font-family:system-ui,-apple-system,sans-serif;font-size:15px;font-weight:600;padding:12px 16px;border-radius:999px;box-shadow:0 4px 16px rgba(0,0,0,.35)';
    document.body.appendChild(a);
  }

  function addBackToTop() {
    if (document.getElementById('backToTop')) return;
    if (!document.body) return;
    var btn = document.createElement('button');
    btn.id = 'backToTop';
    btn.setAttribute('aria-label', 'Back to top');
    btn.title = 'Back to top';
    btn.innerHTML = '&#8593;';
    btn.style.cssText = 'position:fixed;bottom:148px;right:16px;width:48px;height:48px;border-radius:50%;border:none;background:#FFD700;color:#1a1a1a;font-size:22px;line-height:1;cursor:pointer;opacity:0;visibility:hidden;transition:opacity .3s,visibility .3s,transform .2s;box-shadow:0 4px 12px rgba(0,0,0,.35);z-index:9999;padding:0;';
    document.body.appendChild(btn);
    window.addEventListener('scroll', function () {
      var s = window.pageYOffset || document.documentElement.scrollTop;
      if (s > 300) { btn.style.opacity = '1'; btn.style.visibility = 'visible'; }
      else { btn.style.opacity = '0'; btn.style.visibility = 'hidden'; }
    }, { passive: true });
    btn.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  }

  function initFloats() {
    addAiButton();
    addBackToTop();
    placeFloats();
    if (window.MutationObserver && document.body) {
      new MutationObserver(placeFloats).observe(document.body, { childList: true });
    }
    window.addEventListener('resize', placeFloats);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { initFloats(); placeFloats(); });
  } else {
    initFloats();
  }

  window.showCookieBanner = function () {
    try { localStorage.removeItem(KEY); } catch (e) {}
    showBanner();
  };
})();
