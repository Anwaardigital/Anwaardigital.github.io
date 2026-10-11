// ===== FEATURE 1: App of the Week — weekly rotation (aotw.js) =====
// Depends on: element ids from aotw.html. Runs on DOMContentLoaded.
(function(){
  const APPS = [
    {
      title: "Islam 786",
      version: "v3.5",
      icon: "icons/islam786.png",
      desc: "Namaz timings, Quran, duas, tasbeeh aur Islamic calendar — sab kuch ek hi app mein.",
      download: "https://anwaardigital.github.io/downloads/MalikAnwaar-Islam786-v3.5.apk",
      bullets: [
        "✅ Sunni Hanafi Barelvi maslak ke mutabiq namaz ke auqaat",
        "✅ Mukammal Quran, duas aur tasbeeh counter",
        "✅ Bilkul FREE — koi ads, koi hidden charges nahi"
      ]
    },
    {
      title: "LensCraft",
      version: "v6.0",
      icon: "icons/lenscraft.png",
      desc: "30+ iPhone-style camera filters, frames aur photo editor — tasveerain khubsurat banao!",
      download: "https://anwaardigital.github.io/downloads/MalikAnwaar-LensCraft-v6.0.apk",
      bullets: [
        "✅ 30-40 professional camera filters aur frames",
        "✅ Basic face stickers aur easy photo editor",
        "✅ Instagram-ready pics — ek click mein!"
      ]
    },
    {
      title: "Taleem Hub",
      version: "v2.0",
      icon: "icons/taleemhub.png",
      desc: "Bachon ke liye Urdu, English, Math aur Islamiat — taleem ab mazedaar!",
      download: "https://anwaardigital.github.io/downloads/MalikAnwaar-TaleemHub-v2.0.apk",
      bullets: [
        "✅ Urdu + English + Math + Islamiat courses",
        "✅ Bachon ke liye asaan aur mazedaar interface",
        "✅ 100% FREE — baghair kisi subscription ke"
      ]
    },
    {
      title: "Bike Racer 3D",
      version: "v1.1",
      icon: "icons/bikeracer.png",
      desc: "Asli 3D bike racing game — tez raftaar, traffic aur mazedaar stunts!",
      download: "https://anwaardigital.github.io/downloads/MalikAnwaar-BikeRacer3D-v1.1.apk",
      bullets: [
        "✅ Real 3D graphics — Play Store standard quality",
        "✅ Traffic, near-miss bonus aur challenging tracks",
        "✅ Offline khele — internet ki zaroorat nahi"
      ]
    }
  ];

  function weekNumber(){
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now - start) / 86400000);
    return Math.ceil((days + start.getDay() + 1) / 7);
  }

  document.addEventListener("DOMContentLoaded", function(){
    const card = document.getElementById("aotwCard");
    if(!card) return;
    const app = APPS[weekNumber() % APPS.length];

    document.getElementById("aotwIcon").src = app.icon;
    document.getElementById("aotwIcon").alt = app.title + " icon";
    document.getElementById("aotwVersion").textContent = app.version;
    document.getElementById("aotwTitle").textContent = app.title;
    document.getElementById("aotwDesc").textContent = app.desc;
    document.getElementById("aotwDownload").href = app.download;

    const ul = document.getElementById("aotwBullets");
    ul.innerHTML = "";
    app.bullets.forEach(b => {
      const li = document.createElement("li");
      li.textContent = b;
      ul.appendChild(li);
    });

    const wn = document.getElementById("aotwWeekNum");
    if(wn) wn.textContent = weekNumber();
  });
})();
