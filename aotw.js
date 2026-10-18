// ===== FEATURE 1: App of the Week — weekly rotation (aotw.js) =====
// Depends on: element ids from aotw.html. Runs on DOMContentLoaded.
(function(){
  const APPS = [
    {
      title: "Islam 786",
      version: "v3.9",
      icon: "icons/islam786.png",
      desc: "Prayer timings, Quran, duas, tasbeeh and Islamic calendar — everything in one app.",
      download: "https://anwaardigital.github.io/downloads/MalikAnwaar-Islam786-v3.9.apk",
      bullets: [
        "✅ Accurate prayer times (Sunni Hanafi Barelvi)",
        "✅ Complete Quran, duas and tasbeeh counter",
        "✅ Completely FREE — no ads, no hidden charges"
      ]
    },
    {
      title: "LensCraft",
      version: "v6.0",
      icon: "icons/lenscraft.png",
      desc: "30+ iPhone-style camera filters, frames and photo editor — make your photos stunning!",
      download: "https://anwaardigital.github.io/downloads/MalikAnwaar-LensCraft-v6.0.apk",
      bullets: [
        "✅ 30-40 professional camera filters and frames",
        "✅ Basic face stickers and easy photo editor",
        "✅ Instagram-ready pics — in one click!"
      ]
    },
    {
      title: "Taleem Hub",
      version: "v2.0",
      icon: "icons/taleemhub.png",
      desc: "Urdu, English, Math and Islamiat for kids — learning made fun!",
      download: "https://anwaardigital.github.io/downloads/MalikAnwaar-TaleemHub-v2.0.apk",
      bullets: [
        "✅ Urdu + English + Math + Islamiat courses",
        "✅ Easy and fun interface designed for kids",
        "✅ 100% FREE — no subscription needed"
      ]
    },
    {
      title: "Bike Racer 3D",
      version: "v1.2",
      icon: "icons/bikeracer.png",
      desc: "Real 3D bike racing game — high speed, traffic and thrilling stunts!",
      download: "https://anwaardigital.github.io/downloads/MalikAnwaar-BikeRacer3D-v1.2.apk",
      bullets: [
        "✅ Real 3D graphics — Play Store standard quality",
        "✅ Traffic, near-miss bonus and challenging tracks",
        "✅ Play offline — no internet needed"
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
