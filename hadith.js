/* Daily Hadith widget — 7 authentic ahadith, rotated by day of year */
(function(){
  var hadiths=[
    {
      ar:'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى',
      ur:'"Aamal ka daromadar niyyaton par hai, aur har shakhs ke liye wahi hai jo us ne niyyat ki."',
      ref:'📖 Sahih Bukhari — Hadith 1'
    },
    {
      ar:'مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الْآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ',
      ur:'"Jo Allah aur aakhirat ke din par iman rakhta hai, use chahiye ke achi baat kahe ya khamosh rahe."',
      ref:'📖 Sahih Bukhari — Hadith 6018'
    },
    {
      ar:'لَا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لِأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ',
      ur:'"Tum mein se koi shakhs us waqt tak (kaamil) momin nahi ho sakta jab tak apne bhai ke liye wahi pasand na kare jo apne liye pasand karta hai."',
      ref:'📖 Sahih Bukhari — Hadith 13'
    },
    {
      ar:'خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ',
      ur:'"Tum mein se behtareen woh hai jo Quran seekhe aur sikhaye."',
      ref:'📖 Sahih Bukhari — Hadith 5027'
    },
    {
      ar:'الطُّهُورُ شَطْرُ الْإِيمَانِ وَالْحَمْدُ لِلَّهِ تَمْلَأُ الْمِيزَانَ',
      ur:'"Pakeezgi aadha iman hai, aur "Alhamdulillah" meezan ko bhar deta hai."',
      ref:'📖 Sahih Muslim — Hadith 223'
    },
    {
      ar:'مَا نَقَصَتْ صَدَقَةٌ مِنْ مَالٍ',
      ur:'"Sadqa se maal kabhi kam nahi hota."',
      ref:'📖 Sahih Muslim — Hadith 2588'
    },
    {
      ar:'مَنْ صَلَّى الْبَرْدَيْنِ دَخَلَ الْجَنَّةَ',
      ur:'"Jo Fajr aur Asr ki namazain parhega, woh Jannat mein dakhil hoga."',
      ref:'📖 Sahih Bukhari — Hadith 574'
    }
  ];

  var now=new Date();
  var start=new Date(now.getFullYear(),0,0);
  var dayOfYear=Math.floor((now-start)/86400000);
  var h=hadiths[dayOfYear%hadiths.length];

  var elA=document.getElementById('hdArabic'),
      elU=document.getElementById('hdUrdu'),
      elR=document.getElementById('hdRef');
  if(elA)elA.textContent=h.ar;
  if(elU)elU.textContent=h.ur;
  if(elR)elR.textContent=h.ref;
})();
