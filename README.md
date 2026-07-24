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
- `src/screens/AuthScreen.tsx` — e-posta/şifre giriş + kayıt ekranı
- `src/services/aiCoach.ts` — AI koç için backend proxy pattern (API key ASLA client'ta olmamalı)
- `src/screens/` — Antrenman kaydı, Hacim dashboard'u, AI Koç sohbet (hepsi artık Supabase'ten
  gelen gerçek veriyle çalışıyor)
- `src/navigation/AppNavigator.tsx` — oturum yoksa AuthScreen, varsa alt sekme navigasyonu
- `src/theme.ts` + `gluestack-ui` (`@gluestack-ui/themed`) — tüm ekranlar bu component
  kütüphanesiyle yeniden tasarlandı, marka rengi (yeşil/altın) `primary` skalasına özelleştirildi

## Neler EKSİK (Claude Code'da devam edilecek)
1. ~~Firestore/Supabase bağlantısı~~ — **tamamlandı.** WorkoutLogScreen artık Supabase'e
   yazıyor, açılışta son 4 haftalık geçmiş çekiliyor.
2. ~~Kimlik doğrulama~~ — **tamamlandı** (e-posta/şifre). Google OAuth (web'de zaten
   aktif) mobilde henüz yok — `expo-auth-session` ile deep-link redirect akışı gerekir.
3. ~~AI koç backend'i~~ — **tamamlandı.** `aiCoach` Supabase Edge Function'ı deploy edildi
   (Anthropic Claude Sonnet 5 çağırıyor), `src/services/aiCoach.ts` artık
   `supabase.functions.invoke` kullanıyor. Çalışması için Supabase projesine
   `ANTHROPIC_API_KEY` secret'ının eklenmesi gerekiyor (henüz eklenmedi — para
   gerektirdiği için şimdilik ertelendi).
4. ~~Egzersiz kütüphanesi genişletme + özel egzersiz ekleme~~ — **tamamlandı.**
   `WorkoutLogScreen`'de "+ Egzersiz ekle" butonu → `AddExerciseModal` üzerinden
   `is_custom: true, owner_id` ile `exercises` tablosuna yazıyor (RLS zaten buna izin
   veriyordu).
5. **Apple Watch desteği** — MVP'de stretch goal, bu iskelette yok.
6. **HealthKit entegrasyonu** — v1.5 için, bu iskelette yok.

## Kurulum
```bash
npm install
npx expo start
```
`.env` dosyası web projesiyle **aynı** Supabase projesinin değerlerini içeriyor
(`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`) — bkz. `.env.example`.
