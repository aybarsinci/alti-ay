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
themes/*.css        terminal (varsayılan) · defter · sakin · yolculuk · mektup · gece
js/main.js          giriş
  ├── config.js     tema listesi, varsayılanlar, depo bilgisi, görsel boyutları
  ├── dom.js        element referansları (yeni id buraya eklenir)
  ├── utils.js      tarih (tr-TR), escapeHtml, sayı biçimleri
  ├── treatment.js  kür / tedavi günü hesabı (meta.json'dan türetilir)
  ├── markdown.js   frontmatter + kendi markdown çeviricimiz
  ├── entries.js    fetch + önbellek
  ├── chart.js      kilo & enerji grafiği (SVG, kütüphanesiz)
  ├── render.js     sayfayı çizen TEK yer
  ├── arsiv.js      "günlüğün tamamını indir" — tek dosyalık HTML
  └── theme.js      tema seçici (localStorage + ?tema=)
yaz.html            günlük giriş ekranı (yaz.css + js/yaz.js)
  └── js/github.js  GitHub'a doğrudan commit (yazma yolu)
content/meta.json   başlık, alt başlık, altbilgi, tedavi takvimi, rutin, kitap/kurs
content/index.json  yazı listesi + denormalize enerji/kilo/rutin — en yeni önce
content/entries/    yazılar (.md, frontmatter'da title + date + günün ölçüleri)
content/media/      fotoğraflar (yaz.html yüklerken oluşur)
```

Görünümler: ana sayfa (son `RECENT_FULL` yazı tam metin + arşiv listesi) ve
`?yazi=<slug>` (tek yazı). `?tema=<id>` temayı doğrudan açar.
`yaz.html` ayrı bir sayfa; `index.html` DOM sözleşmesine dahil değil.

## Kurallar

- **Derleme adımı ekleme.** Saf ES modülleri, doğrudan servis edilir. Bundler yok.
- **Markdown için kütüphane ekleme.** `js/markdown.js` bilerek kendi içimizde.
  Dış CDN, kalıcılık şartını bozar (bir gün kaybolursa yazılar okunmaz olur).
- **Renk/yazı tipi `styles.css` içine yazılmaz** — oraya sadece yerleşim girer,
  görsel her şey `themes/*.css` içindedir. Tema dosyaları `index.html`'deki DOM
  sözleşmesine göre yazılır; yeni bir görsel öğe eklerken altı temayı da güncelle.
- **DOM referansları `js/dom.js`'de toplanır.** Başka yerde `getElementById` yok.
- **Tarih/kür etiketleri elle yazılmaz.** Hepsi `treatment.js` üzerinden
  `meta.json` + yazının `date` alanından türetilir.
- **Kullanıcı içeriği `escapeHtml`'den geçer.** `markdown.js` içinde kaçış,
  blok tespitinden *sonra* `inline()` aşamasında yapılır — sırayı değiştirme,
  yoksa `>` alıntı blokları bozulur (bu hata bir kez yaşandı).
- **Yazma tek commit'te olur.** `github.js` Contents API'yi değil Git Data
  API'sini kullanıyor: yazı, `index.json` ve fotoğraf aynı commit'te gider.
  Dosya başına commit atılırsa bağlantı koptuğunda listede görünmeyen yazı
  kalır. `index.json` yazmadan önce **depodan taze okunur** — sitedeki kopya
  CDN'de eskiyebiliyor, üstüne yazılırsa arada eklenen gün silinir.
- **Sayısal alanlarda `type="number"` kullanma.** Türkçe klavyede ondalık
  ayırıcı virgül; `type="number"` virgüllü değeri sessizce siliyor ve veri
  kaybediliyor. `type="text"` + `inputmode="decimal"` + elle ayrıştırma
  (`parseKilo`) — bu hata bir kez yaşandı.

## Yazma yolu (neden Worker yok)

`yaz.html` → `js/github.js` → GitHub API. Araya sunucu **bilerek** girmiyor.
CLAUDE.md'nin eski hâlinde Cloudflare Worker planlanmıştı; iki sebeple vazgeçildi:

1. Worker'ın adresi `*.workers.dev` olurdu, `pages.dev` ise Türkiye'de operatör
   seviyesinde filtreleniyor (arkadaş siteyi açamamıştı). Aynı akıbet muhtemel.
2. Worker bir hesaba, bir ödeme yöntemine, bir alan adına bağlı. Üçü de
   kaybolabilir; kaybolduğu gün yazma yolu kapanır. `api.github.com` kaybolursa
   zaten deponun kendisi yok demektir.

Bedeli: yazma jetonu tarayıcıda durur. İnce ayarlı (fine-grained) PAT, yalnızca
bu depoya `contents:write`, sadece arkadaşın telefonunun localStorage'ında —
kaynak kodda değil. Jeton girişte doğrulanıyor (`verifyAccess`), kaydetme
anında değil: kemoterapi gününde yazı yazıp "kaydedilemedi" görmek en kötü
sıralama. Alan adı geldiğinde Worker'a taşımak isteğe bağlı bir iyileştirme.

## Henüz yapılmadı

- **Video depolama.** 180 gün × 1-2 dk ≈ 5-6 GB; git deposu kaldırmaz (GitHub
  tek dosyada 100 MB'ı reddediyor). R2 planlandı, kart gerektiği için bekliyor.
  `config.js` içindeki `VIDEO_STORE` boş olduğu sürece `yaz.html`'deki video
  alanı **kapalı** — seçtirip kaydetmemek, kaydettiğini sanmasından beter.
- Yorumlar / destek mesajları.

## Bağlam

Kardeş proje: `../bingx dashboard` — aynı yaklaşım (Cloudflare, derleme adımı yok,
modül düzeni). Oradaki alışkanlıklar burada da geçerli.
