# Cihan Albayrak — Kişisel Sanatçı Web Sitesi

Siyah-beyaz, sinematik açılışlı, tek sayfalık kişisel web sitesi.
Vite + sade JavaScript + GSAP (ScrollTrigger) ile geliştirildi.

## Çalıştırma

```bash
npm install
npm run dev      # geliştirme sunucusu
npm run build    # üretim çıktısı → dist/
npm run preview  # üretim çıktısını yerelde önizle
```

`dist/` klasörü herhangi bir statik barındırma hizmetine (Netlify, Vercel, GitHub Pages, cPanel vb.) yüklenebilir.

## İçerik nasıl düzenlenir?

| Ne | Nerede |
| --- | --- |
| Instagram, WhatsApp, e-posta | `src/config.js` — doldurulan bilgiler tüm butonlara otomatik uygulanır. Boş alanlar "Yakında" olarak görünür. |
| "Eğitim hakkında bilgi al" butonu | WhatsApp numarası girilirse WhatsApp'a hazır mesajla, yoksa e-postaya, o da yoksa İletişim bölümüne yönlendirir. |
| Hakkımda metni ve portre | `index.html` → `#hakkimda` (köşeli parantez içindeki yer tutucu cümleleri değiştirin) |
| Tiyatro projeleri | `index.html` → `#tiyatro` içindeki her `<article class="work">` |
| Eğitim başlıkları | `index.html` → `#egitim` içindeki `.course` öğeleri |
| Instagram videoları | `index.html` → `#videolar` içindeki her `.reel`: `data-src="videos/reel-1.mp4"`, isteğe bağlı `data-poster` (yollar başında `/` olmadan yazılmalı), `href` = gönderi linki |

Düzenlenecek yerler HTML içinde `<!-- DÜZENLE -->` yorumlarıyla işaretlidir.

## Medya

- Hero videosu: `public/videos/cihan-albayrak.mp4` (H.264, faststart, sessiz, ~1 MB).
  Video yüklenemezse veya otomatik oynatılamazsa `public/images/hero-poster.jpg` gösterilir.
- Fotoğrafları `public/images/` içine koyun (tercihen 1600px genişlikte WebP/JPG) ve ilgili `src` değerlerini değiştirin (ör. `images/portre.jpg`).
- Yeni bir videoyu web için sıkıştırmak:
  ```bash
  ffmpeg -i girdi.mp4 -an -c:v libx264 -preset slow -crf 28 -pix_fmt yuv420p -movflags +faststart public/videos/cihan-albayrak.mp4
  ```

## Özellikler

- Sinematik açılış: siyah ekran → ışık → "CİHAN" → "ALBAYRAK" → perde açılır gibi ana sayfaya geçiş (Geç butonu, Esc/Enter ile atlanabilir)
- Tam ekran, otomatik oynayan, sessiz ve döngülü video; karartma + vinyet
- Kaydırmada kelime kelime açılan başlıklar, perde gibi açılan fotoğraflar, parallax ve hafif zoom
- Kaydırırken gizlenen/geri gelen menü, aktif bölüm vurgusu, mobilde tam ekran hamburger menü
- `prefers-reduced-motion` desteği, klavye erişimi, "İçeriğe geç" bağlantısı, SEO meta ve schema.org verisi

## Yayın

Site GitHub Pages üzerinde yayında: **https://nfcova.github.io/cihanalbayrak/**

Varsayılan dala yapılan her push'ta `.github/workflows/deploy.yml` siteyi derleyip `gh-pages` dalına yayınlar; birkaç dakika içinde canlıya yansır.
