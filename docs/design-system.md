# Design system kararları

Durum: taslak, kurye platformunda deneniyor · Son güncelleme: 2026-09-30

## 1. Önce design system, sonra araç

Tutarsızlığın kökü araç seçimi değil, kararların bir yerde tutulmamasıdır. Kararlar token olarak tutulur; araçlar bu token'ları okur.

Araç zinciri en fazla üç halka: **Magic Patterns (keşif) → Figma (tek doğru kaynak) → kod**. Figma Make ve v0 aynı işi yaptığı için ikisi de zincirde yok.

## 2. Tek çekirdek, ürün başına tema

Her ürün için ayrı bir sistem kurulmaz. Katmanlar:

| Katman | Dosya | Kim değiştirir | Ürüne göre değişir mi? |
|---|---|---|---|
| Primitives | `core/primitives.json` | DS sahibi | Hayır |
| Semantic | `core/semantic.json` | DS sahibi | Hayır |
| Theme | `themes/<ürün>.json` | Ürün tasarımcısı | **Evet**: marka rengi, yazı tipi, radius |
| Context | `contexts/<bağlam>.json` | DS sahibi + saha verisi | Hayır, kullanım ortamına göre değişir |

Bileşenler yalnızca Semantic ve Context katmanlarına bağlanır. Yeni ürün eklemek, `themes/` altına bir dosya eklemek demektir. Bileşen mantığı, boşluk ve etkileşim kuralları ortak kalır.

## 3. Aynı token'lar, farklı bileşenler

Web ve mobil aynı token'ları kullanır, ama aynı bileşenleri kullanmak zorunda değildir. Fark "bağlam" katmanında tutulur:

| Token | Field (kurye) | Office (panel) | Neden |
|---|---|---|---|
| `size.touch-min` | 56 | 32 | Eldivenli parmak |
| `size.control-height` | 64 | 40 | |
| `font.size.body` | 18 | 14 | Kol mesafesi, hareket halinde okuma |
| `border.control-width` | 2 | 1 | Güneşte kenar seçilebilirliği |
| `color.text.secondary` | neutral.700 | neutral.600 | Güneşte kontrast kaybı |
| Metin kontrast eşiği | 7:1 (AAA) | 4.5:1 (AA) | `verify.mjs` ile ölçülür |

Bu değerler kesin değil; saha pilotunda doğrulanacak varsayımlar ([field-hypotheses.md](field-hypotheses.md)).

## 4. İddia değil, ölçüm

"Erişilebilir", "yüksek kontrastlı" gibi ifadeler kural olarak yazılır ve CI'da ölçülür (`npm run tokens:verify`). İlk çalıştırmada bu kurallar 7 token değerini reddetti (ör. marka mavisi 600 saha eşiğini geçmiyordu, 700'e çekildi).

## 5. Bilinen kısıtlar

- **Figma Starter planı:** değişken koleksiyonu başına 1 mod. Tema ve bağlamlar bu yüzden mod değil, ayrı koleksiyon. Bir Figma dosyası bir tema taşır. Professional'a geçildiğinde `Theme` tek koleksiyon, ürünler de mod olabilir.
- **Figma hesabı "View" koltuğunda:** dosyayı düzenlemek için ekipte en az bir tasarımcının Full/Dev koltuğu olmalı.
- **Figma REST Variables API yalnızca Enterprise'ta:** senkronizasyon bu yüzden plugin script'iyle yapılıyor ([token-pipeline.md](token-pipeline.md)).
- **Marka rengi geçici:** Pinpas mavisi (#1A3FAF) ve amber vurgu, marka kararı verilene kadar yer tutucudur. Değiştirmek için yalnızca `themes/pinpas.json` değişir; `verify` yeni rengin eşikleri geçip geçmediğini söyler.
