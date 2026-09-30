# Saha pilotu: doğrulanacak tasarım varsayımları

UX'in asıl kaynağı saha. Aşağıdaki her madde bir tasarım kararı ve o kararı doğrulayacak ya da çürütecek ölçüm. Masa başında verilmiş değerler (touch-min 56, gövde metni 18 vb.) pilot sonunda bu tabloya göre güncellenir.

Pilot: 4 hafta · Figma: "Kurye — Tasarım yönleri" sayfası

## Token varsayımları (Context/Field)

| Varsayım | Şu anki değer | Ölçüm | Karar kuralı |
|---|---|---|---|
| Eldivenle hedeflenebilir en küçük alan | 56px | Yanlış dokunma oranı (dokunma alanının dışına düşen) | > %3 ise 64'e çık |
| Hareket halinde okunur gövde metni | 18px | Adres/kat bilgisi için tekrar bakma sayısı (gözlem) | |
| Güneşte ikincil metin | neutral.700 (11.3:1) | Öğlen dış mekân okunurluk testi | Okunamıyorsa primary'ye birleştir |
| Kontrol kenarlığı | 2px, neutral.600 | Boş kod hücresinin güneşte seçilebilirliği | |

## Akış varsayımları (üç tasarım yönü)

| Yön | Varsayım | Ölçüm |
|---|---|---|
| A · Tek görev | Yalnızca sıradaki durağı göstermek yanlış adrese teslimi azaltır | Yanlış teslim / 100 teslim |
| A · Tek görev | 72px özel tuş takımı, sistem klavyesinden daha az hatalı | Kod girişinde silme oranı, medyan giriş süresi |
| B · Harita + panel | Kaydırarak onay kazara teslim onayını ortadan kaldırır | Geri alınan / itiraz edilen teslim |
| B · Harita + panel | Kaydırma eldivenle ve tek elle yapılabilir | Başarısız kaydırma denemesi oranı |
| C · Bina bazlı liste | Aynı binadaki teslimleri gruplamak adres başına süreyi kısaltır | Binada ilk ve son teslim arası süre |
| C · Bina bazlı liste | Günün tamamını görmek, kuryenin sırayı daha iyi yönetmesini sağlar | Önerilen sıradan sapma × gecikme |

## Masa başında cevaplanamayan sorular

- Kurye paketi elindeyken kodu tek eliyle mi giriyor, paketi yere mi bırakıyor?
- Alıcı kodu sesli mi söylüyor, ekranını mı gösteriyor? (Ekran gösteriliyorsa tuş takımı yerine QR daha hızlı olabilir.)
- Telefon nerede duruyor: elde, gidon tutucusunda, cepte?
- Kod olmadan teslim ("Kod yok") ne sıklıkla gerekiyor ve nasıl kayıt altına alınmalı?

Bu sorular pilotun ilk haftasındaki gözlem oturumlarının gündemi.
