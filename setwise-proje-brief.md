# Setwise: Hipertrofi Zekası — Proje Brief (Claude Code için)

## Ürün vizyonu
Setwise'ı, mevcut tracker'ların (Hevy, Strong, JEFIT) sahip olmadığı üç şeyi bir arada sunan bir "hipertrofi zekası" uygulamasına dönüştürüyoruz:
1. Kas grubu bazında haftalık hacim takibi (bilim-tabanlı hedeflere göre - haftada kas başına ~10-20 set, MEV/MRV çerçevesi)
2. Açıklanabilir progresif overload önerileri ("bu ağırlık, bu hafta, şu yüzden")
3. Bağlamı gerçekten anlayan (loglanan hacim, kas ağrısı, isteğe bağlı HRV/uyku verisini gören) sohbet tabanlı bir AI koç

Rakip uygulamaların hiçbiri bu üçünü aynı anda sunmuyor - Hevy'nin AI'ı algoritmik (sohbet değil), toparlanma verisi entegrasyonu neredeyse hiçbir köklü oyuncuda yok.

## Tech stack kararı
- **Mevcut Setwise kod tabanı (Next.js, Supabase/Postgres, TypeScript, Tailwind, shadcn/ui)**: pazarlama sitesi + web dashboard + backend olarak kalsın, atılmasın.
  (Not: proje Firebase/Firestore ile başlamıştı, `MIGRATION.md`'de belgelendiği üzere Supabase'e
  tamamen geçti — PR geçmişi/hacim sorguları için ilişkisel şema, nested Firestore doküman
  modelinden daha uygun bulundu.)
- **Yeni: React Native / Expo mobil uygulaması** - asıl loglama deneyimi burada olacak. Sebep: kategori mobil-öncelikli, App Store/ASO varlığı ve Apple Watch desteği web'de mümkün değil, gym'de hızlı set girişi native app gerektiriyor.
- Supabase backend'i her iki tarafta da (web dashboard + mobil app) ortak kullanılabilir — aynı proje, aynı kullanıcılar, aynı `exercises`/`workouts`/`sets` şeması.
- AI koç için LLM API entegrasyonu (Claude/GPT) - kullanıcının loglanmış hacim/ağrı/HRV verisini context olarak gönderip sohbet tabanlı yanıt üretme.
- İsteğe bağlı v1.5: Apple HealthKit entegrasyonu (uyku, kas ağrısı, HRV çekme) - sadece Apple ekosistemi ile başla, Whoop/Oura/Garmin sonraya.

## MVP kapsamı (hedef: 3-4 ay)
1. React Native/Expo ile hızlı, offline-çalışabilen set/rep/ağırlık loglama (gym wifi'sinde bile sorunsuz)
2. Kas grubu bazlı haftalık hacim dashboard'u - hedefe karşı ilerleme görselleştirmesi
3. Açıklanabilir progresif overload önerisi motoru (basit kural tabanlı + LLM ile "neden" açıklaması)
4. Sohbet tabanlı AI koç (LLM API, kullanıcının antrenman geçmişini context olarak alan)
5. Apple Watch desteği - stretch goal, MVP'de olmasa da olur

## Kapsam dışı bırakılanlar (v2'ye ertelendi)
- Beslenme/kalori takibi (kapsamı ikiye katlıyor, gap gerçek ama sonraya bırak)
- Whoop/Oura/Garmin entegrasyonu (üretici bazlı API işi, çok zaman alıyor)
- B2B koç/PT paneli (farklı bir ürün/GTM, soğuk satış gerektiriyor)

## Fiyatlandırma planı
- Freemium, Pro ~3-10$/ay veya ~30-40$/yıl (kategori normu)
- Yıllık plan önceden seçili, 7+ günlük deneme
- PPP/yerelleştirilmiş fiyatlandırma ilk günden (Türkiye dahil, ama gelir hedefi USD/EUR kullanıcıları)
- Black Friday / Yılbaşı için lifetime seçeneği (zirve dönüşüm pencereleri)

## Dağıtım planı - EN KRİTİK KISIM
Rapor net gösteriyor: kazananlar (Gravl ~440K$/ay, Liftoff ~300-500K$/ay) ürünle değil, TEK bir dağıtım kanalında tutarlı içerikle kazandı (Reddit-sonra-reklam / organik TikTok). Ürün geliştirmeye başlamadan önce/paralel olarak:
- Tek bir kanal seçilecek (X'te build-in-public VEYA TikTok/Instagram'da kurucu-liderliğinde fitness içeriği)
- MVP geliştirme sürecinin kendisi içerik malzemesi olacak
- Reddit'te (r/fitness, r/bodybuilding, r/weightroom gibi) geri bildirim/beta testi ile başlangıç kullanıcı tabanı

## Başarı eşikleri (aşamalı plan)
1. MVP'yi ~4 ayda yayınla, build-in-public devam etsin
2. Lansmandan sonraki 90 günde deneme-başlatma >%5 ve deneme-ödemeye-geçiş >%30 ise → toparlanma katmanına (HealthKit) yatırım yap
3. Kurulumlar durursa → önce pazarlama kanalını değiştir, ürüne dokunma
4. ~1K$ MRR'a ulaşınca → beslenme veya niş (Türkçe/powerlifting) versiyonunu değerlendir

## Gerçekçi beklenti
Fitness kategorisinde uygulamaların sadece %5'i ilk 2 yılda 10.000$ toplam gelire ulaşıyor; kategori "kazanan çoğunu alır" türünde. 3-6. ayda 0-1K$ MRR, 12. ayda 1-5K$ MRR iyi bir sonuç sayılır - "hızlı büyük başarı" beklentisiyle değil, düşük maliyetli, gerçek bir alan uzmanlığına dayanan bir bahis olarak yaklaşılmalı.
