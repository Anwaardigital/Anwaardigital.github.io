/* App Request form — validates then opens WhatsApp with prefilled message */
(function(){
  var form=document.getElementById('rqForm'),
      msg=document.getElementById('rqMsg');
  if(!form)return;
  function show(text,type){msg.textContent=text;msg.className='rq-msg show '+type;}
  var WA_NUMBER='923288317526';

  form.addEventListener('submit',function(ev){
    ev.preventDefault();
    var name=document.getElementById('rqName').value.trim(),
        phone=document.getElementById('rqPhone').value.trim(),
        app=document.getElementById('rqApp').value.trim(),
        details=document.getElementById('rqDetails').value.trim();

    if(name.length<2){show('⚠️ Barah-e-karam apna naam likhein.', 'err');return;}
    if(!/^[\d\s+\-()]{7,15}$/.test(phone)){show('⚠️ Barah-e-karam durust WhatsApp number likhein.', 'err');return;}
    if(app.length<2){show('⚠️ Barah-e-karam app ka naam likhein.', 'err');return;}

    var text='Assalam o Alaikum!\n\n*New App Request*\n\n'
      +'👤 Naam: '+name+'\n'
      +'📱 WhatsApp: '+phone+'\n'
      +'📲 App ka Naam: '+app+'\n'
      +'📝 Details: '+(details||'—');
    window.open('https://wa.me/'+WA_NUMBER+'?text='+encodeURIComponent(text),'_blank','noopener');
    show('✅ Thank you! Your request has been opened in WhatsApp.', 'ok');
    form.reset();
  });
})();
