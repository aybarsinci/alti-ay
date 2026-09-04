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

## Günlüğe telefondan yazma (`yaz.html`)

`https://<site>/yaz.html` bir giriş ekranıyla açılır. Yazılan gün doğrudan bu
depoya işlenir: `content/entries/<slug>.md`, `content/index.json` ve varsa
fotoğraf **tek commit'te** gider, site birkaç dakika içinde kendini günceller.

Kurulum bir kereliktir:

1. GitHub → Settings → Developer settings → **Personal access tokens** →
   *Fine-grained tokens* → **Generate new token**
2. **Repository access:** *Only select repositories* → bu depo
3. **Permissions → Repository permissions → Contents: Read and write**
   (başka hiçbir yetki gerekmiyor)
4. Süreyi olabildiğince uzun seç ve takvime bir hatırlatma koy — süresi dolunca
   kaydetme durur, ekranda "anahtar süresi dolmuş" yazar.
5. Üretilen anahtarı telefonda `yaz.html`'e bir kez yapıştır. Tarayıcıda kalır;
   her gün tekrar sorulmaz. Değiştirmek için sağ üstteki "Anahtarı değiştir".

Anahtar kaynak kodda **durmaz**, sadece o telefonda durur. Neden araya sunucu
koymadığımız `CLAUDE.md` içindeki "Yazma yolu" bölümünde.

> **Video alanı şimdilik kapalı.** Video depolama (R2) bağlanana kadar açılmıyor;
> gerekçesi `CLAUDE.md` → "Henüz yapılmadı".

## Günlüğün tamamını indirme

Ana sayfanın en altındaki **"Günlüğün tamamını indir"**, bütün yazıları ve
fotoğrafları içine gömülmüş tek bir HTML dosyası üretir. O dosya hiçbir şeye
bağlı değildir: internet olmadan açılır, kopyalanır, yazdırılabilir. Site bir
gün kapanırsa aileye kalacak şey budur.

## Temalar

Altı tema var: **terminal** (varsayılan), **defter**, **sakin**, **yolculuk**,
**mektup**, **gece**.
Sağ alttaki seçiciden değiştirilir, seçim tarayıcıda saklanır.
`?tema=gece` ile doğrudan da açılabilir.

Tema kesinleştiğinde `js/config.js` içinde:

```js
export const DEFAULT_THEME = "terminal";  // seçilen tema
export const SHOW_THEME_PICKER = false;   // seçiciyi gizle
```

Yeni tema eklemek: `themes/<ad>.css` dosyası yaz (mevcut birini kopyalayarak başla)
ve `js/config.js` içindeki `THEMES` listesine bir satır ekle. Temalar sadece renk ve
yazı tipi verir; yerleşim `styles.css` içindedir ve ortaktır.

## Yayına alma

Site **GitHub Pages**'te: <https://aybarsinci.github.io/alti-ay/>. `main`'e
gönderilen her şey birkaç dakika içinde yayına girer; derleme adımı yok.

> `.nojekyll` dosyasını silme. Olmadığında GitHub Pages araya Jekyll sokup
> `.md` dosyalarını HTML'e çeviriyor ve yazılar 404 veriyor.

Cloudflare Pages denendi ve bırakıldı: `pages.dev` Türkiye'de operatör
seviyesinde filtreleniyor, site açılmıyordu.

## Sırada ne var

- [x] **Yazma sayfası** — telefondan tek elle doldurulur, kaydedince markdown
      dosyasını kendisi oluşturur (`yaz.html`).
- [x] Fotoğraf yükleme (yüklerken otomatik küçültme).
- [x] Tek dosya hâlinde indirme ("günlüğün tamamını indir").
- [ ] **Video** — depolama çözülmeden alan açılmıyor (R2, kart gerekiyor).
- [ ] Yorum / destek mesajları — şimdilik yok, sonra eklenecek.

## Dosya düzeni

```
index.html          tek sayfa, DOM iskeleti
styles.css          ortak yerleşim (renk/yazı tipi YOK)
themes/*.css        beş tema — sadece renk, yazı tipi, süsleme
yaz.html          günlük giriş ekranı (yaz.css)
js/
  config.js         ayarlar (tema listesi, varsayılanlar, depo bilgisi)
  dom.js            element referansları
  utils.js          tarih, kaçış, sayı biçimleri
  treatment.js      kür / tedavi günü hesabı
  markdown.js       frontmatter + markdown çevirici
  entries.js        içerik yükleme + önbellek
  chart.js          kilo & enerji grafiği
  render.js         sayfayı çizen tek yer
  arsiv.js          günlüğün tamamını tek dosyaya çıkarır
  theme.js          tema seçici
  main.js           giriş noktası
  yaz.js            giriş ekranının mantığı
  github.js         depoya yazma (tek commit)
content/
  meta.json         başlık, alt başlık, tedavi takvimi
  index.json        yazı listesi (en yeni önce)
  entries/*.md      yazılar
  media/            fotoğraflar
```
