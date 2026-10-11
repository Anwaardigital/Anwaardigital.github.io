// ===== FEATURE 3: Dark Mode toggle — behaviour (darkmode.js) =====
// Integrate: <script src="darkmode.js"></script> before </body>.
// Navbar button HTML snippet (paste inside .nav-inner, next to nav links):
//   <button id="darkModeToggle" class="dark-toggle" aria-label="Toggle theme">🌙</button>

(function(){
  const KEY = "anwaardigital-theme";

  function applyTheme(){
    const light = localStorage.getItem(KEY) === "light";
    document.body.classList.toggle("light-mode", light);
    const btn = document.getElementById("darkModeToggle");
    if(btn) btn.textContent = light ? "☀️" : "🌙";
  }

  document.addEventListener("DOMContentLoaded", function(){
    applyTheme();
    const btn = document.getElementById("darkModeToggle");
    if(btn){
      btn.addEventListener("click", function(){
        const light = document.body.classList.toggle("light-mode");
        localStorage.setItem(KEY, light ? "light" : "dark");
        btn.textContent = light ? "☀️" : "🌙";
      });
    }
  });
})();
