/* Newsletter signup — localStorage based */
(function(){
  var form=document.getElementById('nlForm'),
      input=document.getElementById('nlEmail'),
      msg=document.getElementById('nlMsg');
  if(!form)return;
  function show(text,type){msg.textContent=text;msg.className='nl-msg show '+type;}

  try{
    var saved=localStorage.getItem('ad_newsletter_email');
    if(saved){
      input.value=saved;
      show('✅ Aap pehle se subscribe hain — updates milti rahengi!', 'info');
    }
  }catch(e){}

  form.addEventListener('submit',function(ev){
    ev.preventDefault();
    var email=input.value.trim();
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)){
      show('⚠️ Barah-e-karam durust email address likhein.', 'err');
      return;
    }
    try{localStorage.setItem('ad_newsletter_email',email);}catch(e){}
    show('Shukriya! Aap subscribe ho gaye. 🎉', 'ok');
    form.reset();
  });
})();
