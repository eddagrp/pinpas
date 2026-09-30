# Figma → kod token akışı

Amaç: Figma'daki değişkenlerle koddaki token'ların üç ay sonra da aynı kalması.

```
Figma değişkenleri ──export-variables.js──▶ export.json ──figma:apply-export──▶ packages/tokens/src/*.json
                                                                                        │
                                                         CI: verify (kontrast, bağlam) + build
                                                                                        ▼
                                                               dist/<tema>/<bağlam>.css | .ts | .json
```

Figma koleksiyonları ile kaynak dosyalar birebir eşleşir:

| Figma koleksiyonu | Dosya |
|---|---|
| Primitives | `src/core/primitives.json` |
| Semantic | `src/core/semantic.json` |
| Theme/Pinpas | `src/themes/pinpas.json` |
| Context/Field | `src/contexts/field.json` |
| Context/Office | `src/contexts/office.json` |

Her değişkenin Figma'daki "code syntax" alanında CSS karşılığı yazılıdır (ör. `var(--color-action-primary-bg)`). Dev Mode'da geliştirici doğrudan doğru değişken adını görür.

## Günlük akış: Figma'da değişiklik

1. Tasarımcı değişkeni Figma'da değiştirir.
2. `packages/tokens/figma/export-variables.js` Figma içinde çalıştırılır: Figma MCP (`use_figma`), bir geliştirme plugin'i ya da Scripter ile. Çıktı `export.json` olarak kaydedilir.
3. Değişiklikleri görmek için:
   ```bash
   node packages/tokens/scripts/figma-apply-export.mjs export.json --check
   ```
   Uygulamak için `--check` olmadan çalıştırılır. Figma'da silinen token'lar yalnızca `--prune` ile silinir.
4. PR açılır; CI kontrast ve bağlam kurallarını ölçer. Kural bozulursa birleştirilmez.

`--check` modu fark bulursa exit 1 döner. Export CI'da otomatik alınabildiğinde (Enterprise REST API ya da bir plugin + webhook ile) drift kontrolü de otomatik olur.

## İlk kurulum ya da dosyayı sıfırdan kurmak

Tek seferlik ters yön (kod → Figma):

```bash
node packages/tokens/scripts/figma-push-script.mjs pinpas   # dist/figma/push-pinpas.js üretir
```

Üretilen script Figma'da çalıştırılır. Script idempotenttir: var olanı günceller, eksik olanı oluşturur, fazlaları silmez, raporlar.

## Doğrulandı (2026-09-30)

- Kod → Figma: 124 değişken, 5 koleksiyon oluşturuldu.
- Figma → kod: export, repo ile birebir aynı çıktı (`Figma ile repo aynı.`).
- Figma'da iki değer değiştirilerek (touch-min 56→60, marka rengi 700→800) yapılan simülasyonda `--check` iki farkı da buldu, uygulama sonrası `verify` yeniden ölçtü.
