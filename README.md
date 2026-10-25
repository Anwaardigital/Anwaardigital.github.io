# Malik Anwaar Apps — Website

Premium emerald/gold themed website for all Malik Anwaar apps, games & YouTube channels.

## Files
- `index.html` — main page (Home, Apps, Games, YouTube, About, Contact)
- `styles.css` — emerald/gold theme, mobile responsive
- `script.js` — app data, live search, counters, mobile menu

## Deploy to GitHub Pages (free)
1. Create a new GitHub repo (e.g. `malikanwaarapps`)
2. Upload these 3 files to the repo root
3. Repo → Settings → Pages → Source: `main` branch → Save
4. Site goes live at `https://<username>.github.io/malikanwaarapps/`

## Notes
- Download buttons use WhatsApp (`wa.me/923288317526`) with a pre-filled message — this matches the user's APK distribution flow.
- `DIRECT_LINKS` in `script.js` holds direct APK URLs where available (muse.ai links expire after 48h — replace with permanent links when available).
- To add a new app: add one object to the `APPS` array in `script.js`.
- Colors: emerald `#0A3D2E`, gold `#FFD700` (Islam 786 palette).

---

## Firebase Setup (Login/Signup ke liye) 🔐

Website me Login/Signup **Firebase Authentication** se chalta hai (100% free).

### Step 1 — Firebase project banao
1. [console.firebase.google.com](https://console.firebase.google.com) kholo
2. **"Add project"** → naam likho (e.g. `anwaar-digital`) → Continue
3. Google Analytics OFF kar sakte ho → **Create project**

### Step 2 — Web app add karo
1. Project me **"</>" (Web)** icon dabao
2. Nickname: `Anwaar Digital Website` → **Register app**
3. Jo **firebaseConfig** code milega, usay copy karo

### Step 3 — Config website me dalo
`index.html` me ye block dhondo:
```js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  ...
};
```
Apni real values se replace karo, commit karo. Bas!

### Step 4 — Sign-in methods ON karo
Firebase Console → **Build → Authentication → Sign-in method**:
- ✅ **Email/Password** → Enable → Save
- ✅ **Google** → Enable → Save

### Step 5 — Authorized domain
**Authentication → Settings → Authorized domains** me add karo:
- `anwaardigital.com`

### Note
- Jab tak config placeholder (`YOUR_API_KEY`) hai, login dabane par website friendly message dikhayegi — crash nahi hogi.
- Session **localStorage** me persist hoti hai — browser band karne par bhi login rahega.
- Firebase free tier: 50,000 logins/month — bilkul free.
