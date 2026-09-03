# CLAUDE.md

Bu projede çalışacak sonraki Claude Code oturumları için yönlendirme.
Kullanım ve içerik ekleme için [README.md](README.md).

## Bu nedir

Bir arkadaşın **kemoterapi tedavi günlüğü** için statik site. Sahibi/bakımcısı Aybars.
Herkese açık, Türkçe. Derleme adımı yok, çatı yok, backend yok — henüz.

**Tasarımı belirleyen şart:** site sahibini de aşarak ayakta kalmalı. Kullanıcı bunu
"tedavide başarısız olursam geride aileme bir anı defteri kalsın" diye istedi. Her
teknik karar bu şarta göre verildi; bunu bozacak bir değişiklik önerme.

## Mimari

Tarayıcı → `content/*.json` + `content/entries/*.md` (fetch). Sunucu tarafı yok.

```
index.html          DOM iskeleti (tüm sayfa buradan çizilir)
styles.css          ORTAK yerleşim — renk ve yazı tipi burada YOK
themes/*.css        defter · sakin · yolculuk · mektup · gece
js/main.js          giriş
  ├── config.js     tema listesi, DEFAULT_THEME, SHOW_THEME_PICKER, RECENT_FULL
  ├── dom.js        element referansları (yeni id buraya eklenir)
  ├── utils.js      tarih (tr-TR), escapeHtml
  ├── treatment.js  kür / tedavi günü hesabı (meta.json'dan türetilir)
  ├── markdown.js   frontmatter + kendi markdown çeviricimiz
  ├── entries.js    fetch + önbellek
  ├── render.js     sayfayı çizen TEK yer
  └── theme.js      tema seçici (localStorage + ?tema=)
content/meta.json   başlık, alt başlık, altbilgi, tedavi takvimi
content/index.json  yazı listesi (slug, title, date) — en yeni önce
content/entries/    yazılar (.md, frontmatter'da sadece title + date)
```

Görünümler: ana sayfa (son `RECENT_FULL` yazı tam metin + arşiv listesi) ve
`?yazi=<slug>` (tek yazı). `?tema=<id>` temayı doğrudan açar.

## Kurallar

- **Derleme adımı ekleme.** Saf ES modülleri, doğrudan servis edilir. Bundler yok.
- **Markdown için kütüphane ekleme.** `js/markdown.js` bilerek kendi içimizde.
  Dış CDN, kalıcılık şartını bozar (bir gün kaybolursa yazılar okunmaz olur).
- **Renk/yazı tipi `styles.css` içine yazılmaz** — oraya sadece yerleşim girer,
  görsel her şey `themes/*.css` içindedir. Tema dosyaları `index.html`'deki DOM
  sözleşmesine göre yazılır; yeni bir görsel öğe eklerken beş temayı da güncelle.
- **DOM referansları `js/dom.js`'de toplanır.** Başka yerde `getElementById` yok.
- **Tarih/kür etiketleri elle yazılmaz.** Hepsi `treatment.js` üzerinden
  `meta.json` + yazının `date` alanından türetilir.
- **Kullanıcı içeriği `escapeHtml`'den geçer.** `markdown.js` içinde kaçış,
  blok tespitinden *sonra* `inline()` aşamasında yapılır — sırayı değiştirme,
  yoksa `>` alıntı blokları bozulur (bu hata bir kez yaşandı).

## Henüz yapılmadı

- **Kimlik doğrulama / yazma arayüzü.** Kullanıcı "sonra yaparız" dedi. Plan:
  Cloudflare Worker + GitHub API — şifreli bir yazma sayfası markdown dosyasını
  depoya yazsın, Pages yeniden yayınlasın. Böylece tek doğruluk kaynağı git olur
  ve kalıcılık şartı korunur.
- Fotoğraf yükleme (yüklerken küçültme), yorumlar, "tamamını indir".

## Bağlam

Kardeş proje: `../bingx dashboard` — aynı yaklaşım (Cloudflare, derleme adımı yok,
modül düzeni). Oradaki alışkanlıklar burada da geçerli.
