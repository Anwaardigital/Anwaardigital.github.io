/* ===== Malik Anwaar Apps — data & interactions ===== */
const WA = "https://wa.me/923288317526?text=";
const waMsg = app => WA + encodeURIComponent("Assalam o Alaikum! Mujhe " + app + " download karni hai.");

/* Direct APK links where known (muse.ai file hosting, 48h expiry — replace as needed) */
const DIRECT_LINKS = {
  "Music Player": "https://muse.ai/files/1314374028430291/1826347042113965/ck1x9u5nnt4smhhm1b3c5psk/MalikAnwaar-MusicPlayer-v2.4.apk"
};

const APPS = [
  {name:"Islam 786", ver:"v3.5", icon:"🌙", desc:"Complete Islamic app — prayer times, Quran, duas, Qibla, tasbeeh & more.", dl: null},
  {name:"Malik Anwaar AI", ver:"v4.0", icon:"🤖", desc:"Free AI chat assistant — ask anything in Urdu & English.", dl: null},
  {name:"SafeBox", ver:"v3.1", icon:"🔒", desc:"Private vault — hide photos & videos securely on your phone.", dl: null},
  {name:"CV Maker", ver:"v3.0", icon:"📄", desc:"Build professional CVs & resumes in minutes.", dl: null},
  {name:"ClipCraft", ver:"v3.0", icon:"🎬", desc:"Video editor — trim, merge, music, text & filters.", dl: null},
  {name:"LensCraft", ver:"v6.0", icon:"📸", desc:"Camera filters & photo editor with beautiful effects.", dl: null},
  {name:"App Locker", ver:"v2.3", icon:"🔐", desc:"Lock your apps with PIN — keep your privacy safe.", dl: null},
  {name:"PDF Master", ver:"v2.0", icon:"📕", desc:"All PDF tools — merge, split, compress, rotate & convert.", dl: null},
  {name:"Urdu Notes", ver:"v3.2", icon:"📝", desc:"Beautiful Urdu notes app — write & organize easily.", dl: null},
  {name:"Video Player", ver:"v2.1", icon:"▶️", desc:"Smooth HD video player for all formats.", dl: null},
  {name:"Music Player", ver:"v2.4", icon:"🎵", desc:"Beautiful music player with 16 languages support.", dl: DIRECT_LINKS["Music Player"]},
  {name:"Thumbnail Maker", ver:"v2.0", icon:"🖼️", desc:"Create stunning YouTube thumbnails in seconds.", dl: null},
  {name:"Image Resizer", ver:"v2.0", icon:"📐", desc:"Resize images to any size quickly & easily.", dl: null},
];

const GAMES = [
  {name:"Hill Climb", ver:"v3.4", icon:"🏔️", desc:"Thrilling hill climbing racing — conquer every mountain!", dl: null},
  {name:"Bike Racer 3D", ver:"v1.1", icon:"🏍️", desc:"Real 3D bike racing with stunning graphics.", dl: null},
  {name:"Ludo", ver:"v2.1", icon:"🎲", desc:"Classic Ludo — play with family & friends.", dl: null},
  {name:"Car Driving Sim", ver:"v2.3", icon:"🚗", desc:"Realistic car driving simulator with smooth controls.", dl: null},
];

function cardHTML(app){
  const href = app.dl ? app.dl : waMsg(app.name + " " + app.ver);
  const target = app.dl ? ' target="_blank" rel="noopener"' : ' target="_blank" rel="noopener"';
  return `
  <div class="app-card" data-name="${app.name.toLowerCase()}">
    <div class="app-icon">${app.icon}</div>
    <h3>${app.name}</h3>
    <div class="app-ver">${app.ver}</div>
    <p>${app.desc}</p>
    <div class="card-btns">
      <a href="${href}"${target} class="btn-dl">⬇ Download</a>
    </div>
  </div>`;
}

function render(){
  document.getElementById('appsGrid').innerHTML = APPS.map(cardHTML).join('');
  document.getElementById('gamesGrid').innerHTML = GAMES.map(cardHTML).join('');
}
render();

/* ---------- Live search ---------- */
document.getElementById('appSearch').addEventListener('input', e => {
  const q = e.target.value.trim().toLowerCase();
  const grid = document.getElementById('appsGrid');
  const cards = [...grid.querySelectorAll('.app-card')];
  let visible = 0;
  cards.forEach(c => {
    const show = c.dataset.name.includes(q);
    c.style.display = show ? '' : 'none';
    if (show) visible++;
  });
  let nr = grid.querySelector('.no-result');
  if (visible === 0 && !nr) {
    grid.insertAdjacentHTML('beforeend', '<div class="no-result">No apps found. Try another search 🔍</div>');
  } else if (visible > 0 && nr) nr.remove();
});

/* ---------- Mobile menu ---------- */
const toggle = document.getElementById('navToggle');
const links = document.getElementById('navLinks');
toggle.addEventListener('click', () => links.classList.toggle('open'));
links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => links.classList.remove('open')));

/* ---------- Navbar shadow on scroll ---------- */
window.addEventListener('scroll', () => {
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 30);
}, {passive:true});

/* ---------- Animated counters ---------- */
const counters = document.querySelectorAll('.stat-num');
const io = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (!en.isIntersecting) return;
    const el = en.target, target = +el.dataset.count;
    const t0 = performance.now(), dur = 1200;
    (function tick(t){
      const p = Math.min((t - t0) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
    io.unobserve(el);
  });
}, {threshold:.5});
counters.forEach(c => io.observe(c));
