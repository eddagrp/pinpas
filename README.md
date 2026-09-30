# Pinpas

Pinpas kargo/kurye platformu: kurye uygulaması (mobil), firma paneli ve sipariş dağıtım ekranı (web).

Bu repo aynı zamanda çekirdek design system'in ilk uygulama alanı. Burada işe yarayan yapı Finbee, Origo, LMS ve NOTA'ya taşınacak.

## Yapı

```
packages/tokens/          Design token'ları: tek kaynak, tüm platformlar için çıktı
  src/core/               Tüm ürünlerde ortak: primitives + semantic
  src/themes/pinpas.json  Ürün teması: marka rengi, yazı tipi, radius (ürün başına değişen tek dosya)
  src/contexts/           Kullanım bağlamı: field (kurye, sokak) / office (panel, masaüstü)
  scripts/                build, verify, Figma senkronizasyonu
  figma/                  Figma içinde çalıştırılan export script'i
docs/                     Kararlar ve saha pilotu varsayımları
```

## Komutlar

```bash
npm run tokens:verify   # kontrast ve bağlam kurallarını ölçer
npm run tokens:build    # dist/<tema>/<bağlam>.{css,ts,json}
```

Web: `@pinpas/tokens/pinpas/office.css` · React Native: `import { tokens } from '@pinpas/tokens/pinpas/field'`

## Figma

[Pinpas — Core Design System](https://www.figma.com/design/buSRH7RlJB9hM9tIS7QmYJ): değişkenler, temel bileşenler ve kurye uygulaması için üç tasarım yönü.

Figma ile kod arasındaki akış için: [docs/token-pipeline.md](docs/token-pipeline.md)

## Dokümanlar

- [docs/design-system.md](docs/design-system.md): mimari kararlar ve gerekçeleri
- [docs/token-pipeline.md](docs/token-pipeline.md): Figma → kod senkronizasyonu
- [docs/field-hypotheses.md](docs/field-hypotheses.md): saha pilotunda doğrulanacak tasarım varsayımları
