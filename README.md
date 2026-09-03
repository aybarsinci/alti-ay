# Altı Ay — tedavi günlüğü

Kişisel bir tedavi günlüğü sitesi. Statik: derleme adımı yok, çatı (framework) yok,
veritabanı yok. Yazılar `content/entries/` içinde **düz markdown dosyaları** olarak durur.

## Neden böyle kuruldu

Bu sitenin en önemli şartı uzun ömürlü olması. Onun için:

- **Yazılar düz metindir.** Site bir gün kapansa, tarayıcılar değişse bile
  `content/entries/*.md` dosyaları herkesin okuyabileceği metin olarak kalır.
  Klasörü kopyalayan herkes günlüğün tamamına sahip olur.
- **Dış bağımlılık yok.** Markdown çevirici bile projenin içinde (`js/markdown.js`).
  Yıllar sonra bir CDN kaybolduğunda sayfa bozulmaz.
- **Tarihler kendiliğinden hesaplanır.** "Kaçıncı kür", "tedavinin kaçıncı günü",
  "sıradaki kür" elle güncellenmez; `content/meta.json` içindeki takvimden türetilir.

## Yerelde çalıştırma

```sh
python3 -m http.server 8767
# tarayıcıda: http://localhost:8767
```

> Dosyaya çift tıklayarak açma (`file://`) çalışmaz — tarayıcı modül ve
> `fetch` isteklerini engeller. Mutlaka bir sunucu üzerinden aç.

## Yeni yazı ekleme

1. `content/entries/` içine `YYYY-AA-GG-kisa-baslik.md` adıyla dosya oluştur:

```markdown
---
title: Saçımı kendim kestim
date: 2026-09-02
---

Buraya yazı gövdesi. Boş satır bırakarak yeni paragraf.

**kalın**, *italik*, [bağlantı](https://ornek.com) yazılabilir.

- madde
- madde

> Kendine not olarak düşmek istediğin şeyler için alıntı bloğu.

![Fotoğraf açıklaması](../media/fotograf.jpg)
```

2. `content/index.json` başına aynı yazıyı ekle:

```json
{ "slug": "2026-09-02-sacimi-kendim-kestim", "title": "Saçımı kendim kestim", "date": "2026-09-02" }
```

`slug`, dosya adının `.md` uzantısı olmadan yazılmış hâlidir.

**"Gün 26" ve "Kür 2" etiketlerini yazmana gerek yok** — tarihten hesaplanıyor.

Fotoğraflar `content/media/` içine konur. Telefondan çekilen fotoğraflar büyük olur;
yüklemeden önce küçültmek depoyu şişmekten kurtarır.

## Tedavi takvimini değiştirme

`content/meta.json`:

```json
"treatment": {
  "startDate": "2026-08-08",
  "cycleLabel": "Kür",
  "cycles": [ { "n": 1, "date": "2026-08-08" }, ... ]
}
```

Kür sayısı ve aralığı serbesttir; şerit listeye göre çizilir.
Başlık, alt başlık ve altbilgi de aynı dosyada.

## Temalar

Beş tema var: **defter**, **sakin**, **yolculuk**, **mektup**, **gece**.
Sağ alttaki seçiciden değiştirilir, seçim tarayıcıda saklanır.
`?tema=gece` ile doğrudan da açılabilir.

Tema kesinleştiğinde `js/config.js` içinde:

```js
export const DEFAULT_THEME = "gece";      // seçilen tema
export const SHOW_THEME_PICKER = false;   // seçiciyi gizle
```

Yeni tema eklemek: `themes/<ad>.css` dosyası yaz (mevcut birini kopyalayarak başla)
ve `js/config.js` içindeki `THEMES` listesine bir satır ekle. Temalar sadece renk ve
yazı tipi verir; yerleşim `styles.css` içindedir ve ortaktır.

## Yayına alma (Cloudflare Pages)

```sh
npx wrangler pages deploy . --project-name=<proje-adi> --branch=main
```

Derleme adımı olmadığı için klasörün tamamı doğrudan yayınlanır.

## Sırada ne var

- [ ] **Yazma sayfası** — şifreli, telefondan tek elle yazılabilen bir arayüz;
      kaydedince markdown dosyasını kendisi oluştursun (Cloudflare Worker + GitHub API).
- [ ] Fotoğraf yükleme (yüklerken otomatik küçültme).
- [ ] Yorum / destek mesajları — şimdilik yok, sonra eklenecek.
- [ ] Tek dosya hâlinde indirme ("günlüğün tamamını yazdır/indir").

## Dosya düzeni

```
index.html          tek sayfa, DOM iskeleti
styles.css          ortak yerleşim (renk/yazı tipi YOK)
themes/*.css        beş tema — sadece renk, yazı tipi, süsleme
js/
  config.js         ayarlar (tema listesi, varsayılanlar)
  dom.js            element referansları
  utils.js          tarih, kaçış
  treatment.js      kür / tedavi günü hesabı
  markdown.js       frontmatter + markdown çevirici
  entries.js        içerik yükleme + önbellek
  render.js         sayfayı çizen tek yer
  theme.js          tema seçici
  main.js           giriş noktası
content/
  meta.json         başlık, alt başlık, tedavi takvimi
  index.json        yazı listesi (en yeni önce)
  entries/*.md      yazılar
  media/            fotoğraflar
```
