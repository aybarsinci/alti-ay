# Context / oturum geçmişi

Ne yapıldı ve neden — sonraki oturumlar git log'u kazmadan hikâyeyi bilsin diye.
Yeni girdiler en üste.

---

## 2026-09-04 — Yazma yolu ve arşiv

Alan adı hâlâ yok. Aybars "domaini arkadaşa aldıracağım, onun dışındakileri
yapalım" dedi, o yüzden bu oturum alan adına bağlı olmayan işlere gitti.

### Cloudflare sahiplik sorusu (karar, henüz uygulanmadı)

Aybars: *"cloudflareden o ödeyecek mesela ama benim full controlde olmam lazım"*.
Önerilen yol: **hesabı arkadaş kendi e-postasıyla açsın ve kartını eklesin,
sonra Aybars'ı Super Administrator olarak üye ekletsin.** Fatura ve alan adı
onda kalır (kuruluş oturumundaki sahiplik kararı korunur), Aybars kendi
hesabıyla girip yönetir, arkadaşın şifresine ihtiyaç kalmaz, arkadaş paneli
hiç açmaz. Tersi (Aybars'ın hesabı + arkadaşın kartı) alan adının Aybars'ın
adına kalması demek olurdu.

### Worker planı iptal — yazma doğrudan GitHub'a

Kuruluşta "Cloudflare Worker + GitHub API" planlanmıştı. Vazgeçildi:

1. Worker'ın adresi `*.workers.dev` olacaktı. `pages.dev` Türkiye'de operatör
   seviyesinde filtreleniyor (arkadaş siteyi bu yüzden açamamıştı); aynı
   akıbet çok olası. O zaman alan adı gelene kadar kaydetme yine çalışmazdı.
2. Worker bir hesaba + ödeme yöntemine + alan adına bağlı. Üçü de kaybolabilir.
   `api.github.com` kaybolursa zaten depo da yok demektir.

Aybars seçenekleri gördü ve doğrudan GitHub API'yi seçti. **Bedeli bilinerek
kabul edildi:** yazma jetonu arkadaşın telefonunun localStorage'ında duruyor
(ince ayarlı PAT, sadece bu depo, sadece `contents:write`). Kaynak kodda değil.

Not: `aybarsinci.github.io` tek bir origin — o alan altındaki başka bir Pages
projesinin JS'i bu localStorage'ı okuyabilir. Aybars'ın kendi depoları olduğu
için kabul edildi; özel alan adına geçilirse bu da ortadan kalkar.

### Yapılanlar

- `js/github.js` — Git Data API ile **tek commit**: yazı + `index.json` +
  fotoğraf birlikte. Contents API dosya başına commit atıyor; bağlantı
  koptuğunda listede görünmeyen yazı kalabilirdi.
- `js/yaz.js` yeniden yazıldı. Kapı artık gerçek doğrulama yapıyor
  (`verifyAccess`) — eskisi her şeyi kabul edip hatayı kaydetme anına
  bırakıyordu. "Anahtarı değiştir" düğmesi eklendi (PAT'in süresi dolacak).
- `js/arsiv.js` + altbilgideki "Günlüğün tamamını indir": bütün yazılar ve
  fotoğraflar data URI olarak gömülü **tek HTML dosyası**. İnternetsiz açılır,
  yazdırılabilir (print CSS'i var). Ailenin arşive ulaşma yolu buydu.
  Yerelde denendi: 12 gün → 8 KB, sıralama eskiden yeniye (kitap gibi okunsun).

### Yakalanan hata

`yaz.html`'de kilo alanı `type="number"`, placeholder'ı `71,2` idi. Türkçe
klavyede ondalık ayırıcı virgül ve `type="number"` virgüllü değeri **sessizce
siliyor** — kilo hiç kaydedilmeyecekti, kimse de fark etmeyecekti. Tarayıcıda
doğrulandı (`el.value = "70,8"` → `""`). `type="text"` + `inputmode="decimal"`
+ `parseKilo()` ile düzeltildi, kural CLAUDE.md'ye yazıldı.

### Video

Kapalı bırakıldı (`VIDEO_STORE = ""` → alan `disabled`, gerekçesi ekranda
yazıyor). Seçtirip kaydetmemek, kötü bir günde kaydettiğini sanmasından beter.
180 gün × 1-2 dk ≈ 5-6 GB; git deposu kaldırmaz. R2 kart istiyor, o da
arkadaşın iyi bir gününü bekliyor.

### Hâlâ açık

- Alan adı seçilmedi; Cloudflare hesabı açılmadı.
- **Arkadaştan gerçek veriler alınmadı**: isim, başlangıç tarihi, kür takvimi,
  başlangıç kilosu. İçerik hâlâ 12 günlük uydurma örnek.
- **Yazma yolu canlıda hiç denenmedi** — gerçek bir PAT gerekiyor. Doğrulama,
  önizleme, hata mesajları ve arşiv yerelde çalışıyor; asıl commit değil.
- Cloudflare Pages'teki eski özel alan adı bağlantısı temizlenmedi.
- Video depolama, yorumlar.

---

## 2026-09-03 — Projenin kuruluşu (tek oturum)

### Nasıl başladı

Aybars'ın BingX panosunu grupta gören bir arkadaşı yazdı: son evre lenfoma tanısı
almış, 6 ay kemoterapi görecek. "Tedavi sürecimi gün gün kaydetmek için bir site"
istiyor — hem bu süreçte boşluğa düşmemek için bir uğraş, hem de *"tedavide
başarısız olursam geride aileme ve sevdiklerime bir anı defteri"*.

### İki yanlış dönüş (tekrarlanmasın)

1. **API karmaşası.** Arkadaş "Claude, Gemini API falan derken kafam bulandı"
   demişti. Yapay zekâ API'sine ihtiyaç yok — istediği kendi kelimeleri.
2. **BingX sapması.** Aybars bir ara "asıl olay BingX işlemlerini göstermek"
   dedi, pano mimarisine geçildi. Sonra arkadaşın mesajları geldi: *"Öncelik
   olarak ben hastalık sürecinde kendi takip programı istiyordum"* → **Evet**.
   BingX'i "tabi ki isterim ama sonra, kendi işlem takiplerim için" diyor.
   Pano işi `ileride-bingx/` altına park edildi.

**Ders:** arkadaşın kendi mesajlarını görmeden yön değiştirme.

### Şartname (arkadaşın kendi sözleri, 2026-09-03)

> "Özet Gün Sayacı, Kilo ve Enerji grafiği (bu benim günlük olarak gireceğim
> değerler olabilir), bitirilen kitaplar ve kurslar (bunları manuel olarak
> girecdgim), günlük checklist, son olarak ve **en çok önem verdiğim** her güne
> ait fotoğraf ve 1-2 dklik video çekimlerimin yer aldığı bir site düşündüm"

Checklist kalemlerini de kendisi verdi: yürüyüş (10-15 dk), öğün tamamlama,
ilaç & takviye rutini, ateş ölçümü, sıvı desteği (2,5-3 lt).

Ayrıca: *"takip programı da biraz günlük gibi, takipçilere göstermek için,
geriye bir eser bırakmak için"* — yani tıbbi takip değil, kişisel ilerleme
panosu + herkese açık bir günlük.

### Görsel yön

Arkadaş Gemini'ye Aybars'ın panosunu gösterip bir taslak yaptırmış
(`kaan.fightsuntarsi.com`): yeşil fosfor terminal, `[ KÖŞELİ ]` başlıklar,
KPI şeridi, ilerleme grafiği, checklist, video arşivi. Yani istediği şey
**Matrix Pro'nun sağlık hâli**. Üretimdeki tema (`themes/terminal.css`) buna
göre yazıldı; tokenlar `../bingx dashboard/styles.css`'ten alındı.

Önce 5 farklı yön sunulmuştu (defter/sakin/yolculuk/mektup/gece) — hepsi duruyor,
ama referans netleşince varsayılan `terminal` yapıldı.

### Referans sitedeki kritik kusur

Taslağın altbilgisinde *"Tüm veriler yerel olarak saklanmaktadır"* yazıyordu —
yani **localStorage**. Amacı "geriye eser bırakmak" olan bir site için bu tam
tersini yapıyor: telefon değişse veya tarayıcı temizlense altı aylık kayıt gider.
Bu proje bilinçli olarak tam tersini yapıyor (aşağıya bak).

### Mimari kararlar

- **Yazılar düz markdown dosyası** (`content/entries/*.md`). Site kapansa bile
  klasörü kopyalayan herkes günlüğün tamamına sahip olur. Kalıcılık şartı
  yapının kendisine gömülü, sonradan eklenen bir yedekleme özelliğine değil.
- **Markdown çevirici proje içinde** (`js/markdown.js`, ~110 satır). CDN'den
  kütüphane çekilmedi: beş yıl sonra o CDN kaybolursa yazılar okunmaz olur.
- **Tarihler türetiliyor.** Yazıya sadece `title` + `date` giriliyor; "Gün 26",
  "Kür 2", "27/180" hepsi `meta.json`'daki takvimden hesaplanıyor. Kemoterapi
  gününde uğraşacağı bir alan daha olmasın diye.
- **`index.json` denormalize.** Enerji/kilo/rutin orada da duruyor ki grafik
  180 tane `.md` indirmeden çizilebilsin. `.md` kaynak, `index.json` indeks.

### Barındırma serüveni

1. Cloudflare Pages'e atıldı → `alti-ay.pages.dev`. Arkadaş açamadı:
   `ERR_CONNECTION_TIMED_OUT`. DNS çözülüyor ama bağlantı düşüyor →
   **Türkiye'de `pages.dev` operatör seviyesinde filtreleniyor.**
   (Aybars'ın kendi panosunun özel alan adında olması da bunun kanıtı.)
2. `altiay.aybarsinci.com` denendi — Pages projesine bağlandı ama token'da
   **DNS: Edit yetkisi yok**, kayıt oluşmadı. Aybars zaten "benim siteme
   koymadan çözelim" dedi, bu yol bırakıldı. **Pages'teki o özel alan adı
   bağlantısı hâlâ duruyor, temizlenmeli.**
3. **GitHub Pages** → `https://aybarsinci.github.io/alti-ay/` — çalışıyor.
   `github.io` engellenmiyor.

**Tuzak:** GitHub Pages varsayılan olarak Jekyll çalıştırıp `.md` dosyalarını
HTML'e çeviriyor, aslını yayınlamıyordu → yazılar 404. **`.nojekyll`** ile
çözüldü. Bu dosya silinmemeli.

### Sahiplik kararı

Aybars: *"domain alırsa kendisinin almasını istiyorum, Cloudflare fatura
çıkarsa onun ödemesini istiyorum"*, sonra sadeleştirdi: **Cloudflare + alan adı
arkadaşta, GitHub Aybars'ta.** Bakımı Aybars yapıyor; arkadaşın panele girmesi
gerekmeyecek (bir kere API token üretip verir, gerisi CLI'dan).

Ertelendi: arkadaş kemoterapinin ağır döneminde, hesap açma/kart ekleme işi
kürler arası iyi bir güne bırakıldı. Taşıma maliyeti düşük (dosyalar düz metin).

### Bilinen açık uç

- **Alan adı seçilmedi.** Bu olmadan Cloudflare kurulumu başlayamıyor.
- **Arkadaştan gerçek veriler alınmadı**: isim, başlangıç tarihi, kür takvimi,
  başlangıç kilosu. Şu anki içerik tamamen uydurma (12 günlük örnek).
- **Kaydetme çalışmıyor.** `yaz.html` hazır ama `WRITE_ENDPOINT` boş; Worker
  yazılmadı. Şu an "ne kaydedilecek" önizlemesi gösteriyor.
- **Video depolama çözülmedi.** 180 gün × 1-2 dk ≈ 5-6 GB. R2 önerildi
  (ücretsiz kota 10 GB, çıkış ücretsiz, dosyalar düz `.mp4` kalır). Kart gerekiyor.
- **"Hepsini indir" özelliği** yazılmadı — ailenin arşive ulaşma yolu bu olacak.
- Oturum sonunda macOS klasör izni düştü; `tedavi-gunlugu` okunamaz oldu
  (yazma çalışıyordu). Dosya kaybı yok.

---
