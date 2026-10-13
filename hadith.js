/* Daily Hadith widget — 7 authentic ahadith, rotated by day of year */
(function(){
  var hadiths=[
    {
      ar:'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى',
      en:'"Actions are judged by intentions, and every person will have only what they intended."',
      ref:'📖 Sahih Bukhari — Hadith 1'
    },
    {
      ar:'مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الْآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ',
      en:'"Whoever believes in Allah and the Last Day, let him speak good or remain silent."',
      ref:'📖 Sahih Bukhari — Hadith 6018'
    },
    {
      ar:'لَا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لِأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ',
      en:'"None of you truly believes until he loves for his brother what he loves for himself."',
      ref:'📖 Sahih Bukhari — Hadith 13'
    },
    {
      ar:'خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ',
      en:'"The best of you are those who learn the Quran and teach it."',
      ref:'📖 Sahih Bukhari — Hadith 5027'
    },
    {
      ar:'الطُّهُورُ شَطْرُ الْإِيمَانِ وَالْحَمْدُ لِلَّهِ تَمْلَأُ الْمِيزَانَ',
      en:'"Cleanliness is half of faith, and \"Alhamdulillah\" fills the scale."',
      ref:'📖 Sahih Muslim — Hadith 223'
    },
    {
      ar:'مَا نَقَصَتْ صَدَقَةٌ مِنْ مَالٍ',
      en:'"Charity never decreases wealth."',
      ref:'📖 Sahih Muslim — Hadith 2588'
    },
    {
      ar:'مَنْ صَلَّى الْبَرْدَيْنِ دَخَلَ الْجَنَّةَ',
      en:'"Whoever prays Fajr and Asr will enter Paradise."',
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
  if(elU)elU.textContent=h.en;
  if(elR)elR.textContent=h.ref;
})();
