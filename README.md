# Setwise Mobile — başlangıç iskeleti

Bu, proje brief'inde (setwise-proje-brief.md) tarif edilen MVP'nin çalışabilir bir başlangıç
iskeleti. Expo/React Native + TypeScript ile kuruldu, 3 ana ekranı ve çekirdek mantığı
(kas hacmi hesaplama, açıklanabilir progresif overload önerisi) içeriyor.

> **Not:** Mevcut Setwise web projesi (LiftLog kod tabanı) Firebase'den Supabase'e
> tamamen geçmiş durumda (bkz. web projesindeki `MIGRATION.md`). Bu yüzden mobil app
> Firestore değil, web ile **aynı canlı Supabase projesini** (aynı `exercises` /
> `workouts` / `workout_exercises` / `sets` tabloları, aynı kullanıcılar, aynı RLS
> politikaları) kullanıyor.

## Neler hazır
- `src/types/index.ts` — veri modeli (Exercise, SetEntry, kas grubu hedefleri)
- `src/data/exercises.ts` — offline/ilk açılış fallback egzersiz listesi (Supabase'e
  ulaşılamazsa kullanılır)
- `src/services/muscleMap.ts` — web'in daha ayrıntılı kas taksonomisini (front/side/rear
  delts, lats/upper-back/lower-back, traps, forearms) mobilin 10 gruplu modeline eşler
- `src/services/exercises.ts` — web dashboard'un okuduğu aynı `exercises` tablosundan
  egzersiz listesini çeker (ID'ler workout_exercises.exercise_id ile uyumlu kalır)
- `src/services/volume.ts` — haftalık kas hacmi hesaplama + açıklanabilir ağırlık önerisi (ÇEKİRDEK FARKLILAŞTIRICI)
- `src/services/supabase.ts` — Supabase client (AsyncStorage ile oturum kalıcılığı)
- `src/services/workouts.ts` — set kaydetme (günün workout'unu ve workout_exercise satırını
  bulur/oluşturur) ve son N günün geçmişini çekme
- `src/contexts/AuthContext.tsx` — Supabase auth oturum state'i (session, signIn, signUp, signOut)
- `src/hooks/useExercises.ts`, `src/hooks/useWorkoutSets.ts` — ekranların kullandığı veri hook'ları
- `src/screens/AuthScreen.tsx` — e-posta/şifre giriş + kayıt ekranı; şifremi unuttum akışı,
  şifre göster/gizle, e-posta/şifre validasyonu, kart giriş animasyonu ve kısa marka sloganı
  içeriyor
- `src/screens/NewPasswordScreen.tsx` — şifre sıfırlama e-postasındaki linkten (`setwise://reset-password`
  deep link, PKCE `code` değişimi) açılan, `PASSWORD_RECOVERY` auth event'inde gösterilen yeni
  şifre belirleme ekranı
- `src/services/aiCoach.ts` — AI koç için backend proxy pattern (API key ASLA client'ta olmamalı)
- `src/screens/` — Antrenman kaydı, Hacim dashboard'u, AI Koç sohbet (hepsi artık Supabase'ten
  gelen gerçek veriyle çalışıyor)
- `src/navigation/AppNavigator.tsx` — oturum yoksa AuthScreen, varsa alt sekme navigasyonu
  (Antrenman, Takvim, Rutinler, Hacim, AI Koç, Profil); Profil sekmesi kendi içinde küçük bir
  stack (`ProfileMain` → `BodyTracking`) barındırıyor
- `src/theme.ts` + `gluestack-ui` (`@gluestack-ui/themed`) — tüm ekranlar bu component
  kütüphanesiyle yeniden tasarlandı, marka rengi (yeşil/altın) `primary` skalasına özelleştirildi.
  Font çifti web dashboard'la (LiftLog `app/layout.tsx`) birebir aynı: Barlow Condensed
  (başlıklar), Barlow (gövde metni), Geist Mono (ağırlık/tekrar/RPE gibi rakamsal veriler)
- `src/components/AnimatedBackground.tsx` — tüm ana ekranlarda yavaşça sürüklenen yeşil/altın
  glow (RN'in kendi `Animated` API'si + `react-native-svg`, yeni native modül eklemeden;
  cihazın "hareket azalt" ayarına saygı duyuyor)
- `src/screens/CalendarScreen.tsx` — aylık takvim, antrenman yapılan günleri noktayla
  işaretler; bir güne dokununca o günün setlerini ve serbest metin notunu (`workouts.notes`,
  ör. "böyle beslendim işe yaradı") gösterip düzenlemeye izin verir
- `src/screens/ProfileScreen.tsx` — sade hesap bilgisi (isim, e-posta), "Vücut Takibi" kartı,
  çıkış yap. Kilo/boy ve ölçüm check-in'i ana ekranda karışıklık yaratmasın diye ayrı bir
  ekrana taşındı.
- `src/screens/BodyTrackingScreen.tsx` — kilo/boy düzenleme, vücut ölçümleri geçmişi (kilo
  grafiği + bel/göğüs/kol check-in); Profil ekranındaki "Vücut Takibi" kartından açılıyor,
  ileride başka ölçümler (uyluk/kalça/baldır gibi zaten şemada olan kolonlar) buraya eklenebilir
- `src/components/ExercisePickerModal.tsx` + `src/constants/muscleGroups.ts` — WorkoutLogScreen'de
  egzersizler artık yan yana düz bir buton satırı yerine kas grubuna göre (Göğüs/Sırt/Omuz/...)
  ikonlu, aranabilir bir modal listesinde; ana ekranda tek bir "seçili egzersiz" satırı bu
  modalı açıyor
- WorkoutLogScreen başlığında kullanıcının profildeki ilk adıyla "Hoşgeldin, {ad}" karşılaması
- `src/screens/RoutinesScreen.tsx` — rutin (workout template) oluşturma/düzenleme,
  `routines`/`routine_exercises` tablolarını okur-yazar (web ile paylaşılan şema);
  "Başlat" `ActiveRoutineContext` üzerinden Antrenman ekranına o rutinin egzersiz
  listesini ve hedef set/tekrar sayılarını aktarır
- `src/services/personalRecords.ts` — bir set kaydedilince ağırlık/hacim rekoru kırıldıysa
  tespit eder (ısınma setleri hariç), WorkoutLogScreen'de banner olarak gösterilir
- `src/components/LineChart.tsx` — `react-native-svg` üzerine yazılmış minimal çizgi grafik
  (yeni bir chart kütüphanesi eklemeden); kilo geçmişi ve egzersiz bazlı tahmini 1RM için kullanılıyor
- `src/components/ExerciseHistoryModal.tsx` — WorkoutLogScreen'de bir egzersizin geçmişini
  ve Epley formülüyle tahmini 1RM eğrisini gösterir
- Set tipi etiketleme (Normal/Isınma/Drop Set/Başarısızlık) + RPE girişi — `sets` tablosunda
  `set_type`/`rpe` kolonları; `computeWeeklyMuscleVolume` artık ısınma setlerini hacme saymıyor
- Dinlenme sayacı — her set kaydından sonra WorkoutLogScreen'de otomatik başlıyor (+15sn/atla)

## Neler EKSİK (Claude Code'da devam edilecek)
1. ~~Firestore/Supabase bağlantısı~~ — **tamamlandı.** WorkoutLogScreen artık Supabase'e
   yazıyor, açılışta son 4 haftalık geçmiş çekiliyor.
2. ~~Kimlik doğrulama~~ — e-posta/şifre tarafı **tamamlandı** (şifremi unuttum, e-posta onayı,
   yeniden gönderme dahil). Google OAuth kodu yazıldı (`AuthContext.signInWithGoogle`, PKCE +
   `setwise://auth-callback` deep link) ama **Expo Go'da temelden test edilemiyor** — özel URL
   şemaları yalnızca gerçek bir native build'de (EAS dev-client/production) çalışır, Expo Go
   kendi `exp://` şemasını kullanır. Google girişini gerçek anlamda doğrulamak için bir
   dev-client/production build gerekiyor.
3. ~~AI koç backend'i~~ — **tamamlandı.** `aiCoach` Supabase Edge Function'ı deploy edildi
   (Claude Sonnet 5 çağırıyor), `src/services/aiCoach.ts` artık
   `supabase.functions.invoke` kullanıyor. Çalışması için Supabase projesine
   `ANTHROPIC_API_KEY` secret'ının eklenmesi gerekiyor (henüz eklenmedi — para
   gerektirdiği ve gerçek bir API anahtarı olduğu için bu bilerek bir agent
   session'ından geçirilmiyor; Dashboard → Edge Functions → Secrets'tan elle eklenmeli).
4. ~~Egzersiz kütüphanesi genişletme + özel egzersiz ekleme~~ — **tamamlandı.**
   `WorkoutLogScreen`'de "+ Egzersiz ekle" butonu → `AddExerciseModal` üzerinden
   `is_custom: true, owner_id` ile `exercises` tablosuna yazıyor (RLS zaten buna izin
   veriyordu).
5. ~~Rutinler (routines) UI~~ — **tamamlandı.** Bkz. `RoutinesScreen.tsx` yukarıda.
6. ~~RPE + set tipi + rekor tespiti + dinlenme sayacı~~ — **tamamlandı.** Bkz. yukarıdaki
   madde. AI koça RPE verisi henüz beslenmiyor — `askCoach` hâlâ sadece ağırlık/tekrar
   görüyor, ileride RPE'yi de context'e eklemek öneri kalitesini artırır.
7. ~~Vücut ölçümleri + egzersiz bazlı 1RM grafiği~~ — **tamamlandı.** `body_measurements`
   tablosu şu an sadece kilo/bel/göğüs/kol topluyor (UI'da); şema thigh/hip/calf
   kolonlarını da içeriyor, istenirse ProfileScreen'e eklenmesi kolay.
8. **Apple Watch desteği** — MVP'de stretch goal, bu iskelette yok.
9. **HealthKit entegrasyonu** — v1.5 için, bu iskelette yok.
10. **Plaka hesaplayıcı** — rakip uygulamalarda standart, düşük efor/yüksek cila; henüz yok.

## Kurulum
```bash
npm install
npx expo start
```
`.env` dosyası web projesiyle **aynı** Supabase projesinin değerlerini içeriyor
(`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`) — bkz. `.env.example`.
