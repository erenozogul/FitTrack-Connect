# FitTrack-Connect — Hata Analiz Belgesi

**Tarih:** 2026-03-28
**Branch:** claude/practical-ellis

---

## Kritik Hatalar (Bug)

### 1. Auth State Sayfa Yenilemede Kaybolıyor
**Dosya:** `App.tsx`
**Sorun:** `isLoggedIn`, `role`, `userName` state'leri React state'de tutulur. Sayfa yenilendiğinde bu state sıfırlanır, kullanıcı login olmuş olsa bile oturum kapanmış gibi görünür. Oysa `fittrack_token` ve `fittrack_user` localStorage'da saklı.
**Etki:** Kullanıcı her yenilemede login sayfasına düşer.
**Düzeltme:** `useEffect` ile component mount'ta localStorage kontrol et, geçerli token varsa state'i restore et.

---

### 2. Logout localStorage'ı Temizlemiyor
**Dosya:** `App.tsx` — `handleLogout` fonksiyonu
**Sorun:** `handleLogout` yalnızca React state'i sıfırlıyor; `localStorage.removeItem('fittrack_token')` ve `localStorage.removeItem('fittrack_user')` çağrısı yok.
**Etki:** Kullanıcı logout yapsa bile token localStorage'da kalır. Sayfa yenilenince otomatik login olur (Bug #1 ile birleşince döngü oluşur).
**Düzeltme:** `handleLogout` içine localStorage temizleme ekle.

---

### 3. Korumalı Rota (Protected Route) Eksik
**Dosya:** `App.tsx`
**Sorun:** `/library`, `/dashboard`, `/live`, `/chat`, `/analysis`, `/explore`, `/checkout` rotaları auth kontrolü olmadan erişilebilir. Token olmadan URL direkt girilince sayfa açılır.
**Etki:** Yetkisiz erişim; API çağrıları 401 ile başarısız olur ama sayfa açılır, kötü UX.
**Düzeltme:** Basit bir `ProtectedRoute` wrapper ile giriş yapılmamışsa `/` yönlendir.

---

### 4. Role Badge CSS Çakışması
**Dosya:** `pages/LoginScreen.tsx` — satır 79
**Dosya:** `pages/SignUpScreen.tsx` — satır 85
**Sorun:** Student rolü için badge class'ında hem `text-white` hem `text-[#0B2B53]` aynı anda uygulanmış. İki utility class çakıştığında CSS spesifite'ye göre hangisi kazanacağı belirsiz.
```
// Hatalı:
'border-cta-orange/30 text-white bg-white text-[#0B2B53] dark:text-[#0B2B53]/5'
// Doğru:
'border-cta-orange/30 text-cta-orange bg-cta-orange/5'
```
**Etki:** Student badge'i tutarsız renk gösteriyor.
**Düzeltme:** Çakışan class'ları kaldır, tutarlı renk kullan.

---

### 5. TemplateLibrary Hardcoded E-posta
**Dosya:** `pages/TemplateLibrary.tsx` — satır 102
**Sorun:** Profil dropdown menüsünde e-posta `coach@fittrack.com` olarak hardcoded yazılmış, gerçek kullanıcı e-postası gösterilmiyor.
**Etki:** Her kullanıcı aynı yanlış e-postayı görür.
**Düzeltme:** localStorage'dan `fittrack_user` oku ve gerçek e-postayı göster.

---

### 6. Navigation: Student "Home" ve "Profile" Aynı Path
**Dosya:** `components/Navigation.tsx` — satır 38-43
**Sorun:** `studentTabs` içinde hem "Home" hem "Profile" `/dashboard` path'ine gidiyor.
```ts
{ icon: 'home',   label: t.home,    path: '/dashboard' },
{ icon: 'person', label: t.profile, path: '/dashboard' },
```
`isActive` check `location.pathname === tab.path` ile yapıldığından `/dashboard`'dayken her iki tab aynı anda aktif görünür.
**Etki:** Navigation görsel bozukluk; iki tab birden highlight olur.
**Düzeltme:** `tabs` listesinde benzersiz path kullan ya da active check'i index bazlı yap.

---

## Orta Öncelikli Sorunlar

### 7. Kullanılmayan SQLite Bağımlılıkları
**Dosya:** `package.json`
**Sorun:** `sqlite` ve `sqlite3` paketleri declare edilmiş ama projede hiçbir yerde import edilmiyor. Proje Neon/PostgreSQL kullanıyor.
**Etki:** Gereksiz ~20MB+ `node_modules` boyutu, güvenlik açığı yüzeyi.
**Düzeltme:** `sqlite`, `sqlite3`, `@types/sqlite3` bağımlılıklarını kaldır.

### 8. GEMINI_API_KEY Eksik
**Dosya:** `vite.config.ts` satır 14-15, `.env`
**Sorun:** `vite.config.ts`, `env.GEMINI_API_KEY` referans veriyor ama `.env` ve `.env.example` dosyalarında bu değişken tanımlı değil.
**Etki:** Build sırasında `process.env.API_KEY` ve `process.env.GEMINI_API_KEY` → `undefined` olur.
**Düzeltme:** `.env.example`'a `GEMINI_API_KEY=` satırı ekle.

### 9. StudentDashboard Hardcoded Tarih
**Dosya:** `pages/StudentDashboard.tsx` — satır 114
**Sorun:** `'Ekim' : 'October'} 2023` hardcoded. 2026'da hâlâ 2023 gösteriyor.
**Etki:** Yanıltıcı UI.

### 10. JWT_SECRET Zayıf Default
**Dosya:** `api/index.ts` — satır 7
**Sorun:** `process.env.JWT_SECRET || "super-secret-key-for-fittrack"` — env değişkeni tanımlı değilse zayıf, public bilinen bir secret kullanılıyor.
**Etki:** Production'da token güvenliği yok.

---

## Düşük Öncelikli Sorunlar

| # | Sorun | Dosya |
|---|-------|-------|
| 11 | `lib/firebase.ts` — sadece `export {}` içeriyor, dead code | `lib/firebase.ts` |
| 12 | CORS tüm origina açık (`app.use(cors())`) | `api/index.ts` |
| 13 | Linting/Prettier konfigürasyonu yok | Proje geneli |
| 14 | Test suite yok | Proje geneli |
| 15 | `vercel.json` Express mimarisiyle uyumsuz | `vercel.json` |
| 16 | `fix_buttons.cjs` npm scripts'e entegre değil | `fix_buttons.cjs` |

---

## Düzeltilen Sorunlar

- [x] Bug #1: Auth state localStorage'dan restore ediliyor
- [x] Bug #2: Logout localStorage'ı temizliyor
- [x] Bug #3: Protected route eklendi
- [x] Bug #4: Role badge CSS çakışması düzeltildi
- [x] Bug #5: TemplateLibrary hardcoded e-posta düzeltildi
- [x] Bug #6: Navigation duplicate path active state düzeltildi
- [x] Orta #7: Unused sqlite bağımlılıkları kaldırıldı
- [x] Orta #8: .env.example'a GEMINI_API_KEY eklendi
