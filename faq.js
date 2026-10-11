/* ---------- FAQ SECTION accordion JS (Anwaar Digital) ----------
   Pairs with /tmp/feat/faq.html | smooth open/close, one item open at a time */
(function(){
  var items = document.querySelectorAll('#faq .faq-item');
  if(!items.length) return;

  function closeItem(item){
    item.classList.remove('open');
    item.querySelector('.faq-a').style.maxHeight = null;
    item.querySelector('.faq-q').setAttribute('aria-expanded','false');
  }
  function openItem(item){
    item.classList.add('open');
    var body = item.querySelector('.faq-a');
    body.style.maxHeight = body.scrollHeight + 'px';
    item.querySelector('.faq-q').setAttribute('aria-expanded','true');
  }

  items.forEach(function(item){
    item.querySelector('.faq-q').addEventListener('click', function(){
      var isOpen = item.classList.contains('open');
      items.forEach(closeItem);           /* close all others */
      if(!isOpen) openItem(item);          /* toggle this one */
    });
  });

  /* keep open answer sized correctly if window resizes */
  window.addEventListener('resize', function(){
    document.querySelectorAll('#faq .faq-item.open .faq-a').forEach(function(body){
      body.style.maxHeight = body.scrollHeight + 'px';
    });
  });
})();
