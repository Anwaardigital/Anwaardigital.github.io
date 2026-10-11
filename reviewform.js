/* Review form — adds review to the existing .testi-grid and persists in localStorage */
(function(){
  var form=document.getElementById('rvForm'),
      msg=document.getElementById('rvMsg'),
      starsBox=document.getElementById('rvStars');
  if(!form||!starsBox)return;
  var rating=0,
      KEY='ad_user_reviews';

  var starBtns=Array.prototype.slice.call(starsBox.querySelectorAll('button'));
  function paint(){
    starBtns.forEach(function(b){b.classList.toggle('lit',+b.dataset.v<=rating);});
  }
  starBtns.forEach(function(b){
    b.addEventListener('click',function(){rating=+b.dataset.v;paint();});
  });
  paint();

  function show(text,type){msg.textContent=text;msg.className='rv-msg show '+type;}
  function esc(s){return s.replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function getSaved(){try{return JSON.parse(localStorage.getItem(KEY))||[];}catch(e){return[];}}
  function setSaved(list){try{localStorage.setItem(KEY,JSON.stringify(list));}catch(e){}}

  function cardHTML(r){
    var stars='★'.repeat(r.rating)+'☆'.repeat(5-r.rating);
    return '<div class="testi-card"><div class="stars">'+stars+'</div><p>"'+esc(r.text)+'"</p><div class="testi-user">— '+esc(r.name)+'</div></div>';
  }
  function renderSaved(){
    var grid=document.querySelector('.testi-grid');
    if(!grid)return;
    getSaved().forEach(function(r){
      var tmp=document.createElement('template');
      tmp.innerHTML=cardHTML(r).trim();
      grid.appendChild(tmp.content.firstChild);
    });
  }
  renderSaved();

  form.addEventListener('submit',function(ev){
    ev.preventDefault();
    var name=document.getElementById('rvName').value.trim(),
        text=document.getElementById('rvText').value.trim();
    if(name.length<2){show('⚠️ Barah-e-karam apna naam likhein.', 'err');return;}
    if(rating<1){show('⚠️ Barah-e-karam star rating chunein.', 'err');return;}
    if(text.length<5){show('⚠️ Barah-e-karam thora detail mein review likhein.', 'err');return;}

    var review={name:name,rating:rating,text:text,at:Date.now()};
    var list=getSaved();list.push(review);setSaved(list);

    var grid=document.querySelector('.testi-grid');
    if(grid){
      var tmp=document.createElement('template');
      tmp.innerHTML=cardHTML(review).trim();
      grid.appendChild(tmp.content.firstChild);
      grid.scrollIntoView({behavior:'smooth',block:'center'});
    }
    show('Shukriya '+esc(name)+'! Aapka review add ho gaya. 🌟', 'ok');
    form.reset();rating=0;paint();
  });
})();
