// Token setinin kurallarını ölçer; bir kural bozulursa CI kırmızıya düşer.
//  1. Tüm bağlam dosyaları aynı anahtarlara sahip (bileşen hangi bağlamda olursa olsun aynı token'ı bulur).
//  2. Her tema × bağlam kombinasyonu çözülebiliyor (eksik/döngüsel alias yok, isim çakışması yok).
//  3. Kontrast çiftleri eşiği geçiyor. Saha bağlamında metin eşiği AAA (7:1): güneş altında ekran kontrastı düşer.
import { themes, contexts, loadCollection, resolveSet } from '../lib/tokens.mjs';

const errors = [];
const rows = [];

// 1. Bağlam parity
const keysOf = (c) => new Set(loadCollection(c).map((t) => t.path.join('.')));
const [first, ...rest] = contexts();
const base = keysOf(first);
for (const c of rest) {
  const keys = keysOf(c);
  for (const k of base) if (!keys.has(k)) errors.push(`${c.name}: eksik anahtar ${k}`);
  for (const k of keys) if (!base.has(k)) errors.push(`${c.name}: fazladan anahtar ${k} (${first.name}'da yok)`);
}

// 3. Kontrast (WCAG 2.x göreli parlaklık)
const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const f = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

// [ön plan, arka plan, tür] — tür: text (metin) | ui (metin dışı öğe)
const PAIRS = [
  ['color.text.primary', 'color.bg.canvas', 'text'],
  ['color.text.secondary', 'color.bg.canvas', 'text'],
  ['color.text.secondary', 'color.bg.surface-muted', 'text'],
  ['color.text.link', 'color.bg.canvas', 'text'],
  ['color.text.inverse', 'color.bg.inverse', 'text'],
  ['color.action.primary.fg', 'color.action.primary.bg', 'text'],
  ['color.action.primary.fg', 'color.action.primary.bg-pressed', 'text'],
  ['color.action.secondary.fg', 'color.action.secondary.bg', 'text'],
  ['color.action.secondary.fg', 'color.action.secondary.bg-pressed', 'text'],
  ['color.action.danger.fg', 'color.action.danger.bg', 'text'],
  ['brand.on-accent', 'brand.accent', 'text'],
  ['color.status.success.fg', 'color.status.success.bg', 'text'],
  ['color.status.warning.fg', 'color.status.warning.bg', 'text'],
  ['color.status.danger.fg', 'color.status.danger.bg', 'text'],
  ['color.status.info.fg', 'color.status.info.bg', 'text'],
  ['color.border.control', 'color.bg.canvas', 'ui'],
  ['color.border.focus', 'color.bg.inverse', 'ui'],
];
const THRESHOLD = { field: { text: 7, ui: 3 }, office: { text: 4.5, ui: 3 } };

for (const theme of themes()) {
  for (const ctx of contexts()) {
    let set;
    try {
      set = resolveSet(theme.id, ctx.id);
    } catch (e) {
      errors.push(`${theme.id}/${ctx.id}: ${e.message}`);
      continue;
    }
    const v = Object.fromEntries(set.map((t) => [t.path.join('.'), t.resolved]));
    const min = THRESHOLD[ctx.id] ?? THRESHOLD.office;
    for (const [fg, bg, kind] of PAIRS) {
      if (!v[fg] || !v[bg]) {
        errors.push(`${theme.id}/${ctx.id}: kontrast çifti eksik ${fg} / ${bg}`);
        continue;
      }
      const r = ratio(v[fg], v[bg]);
      const ok = r >= min[kind];
      rows.push(`${ok ? '✓' : '✗'} ${theme.id}/${ctx.id}  ${r.toFixed(2).padStart(5)}:1 ≥ ${min[kind]}  ${fg} / ${bg}`);
      if (!ok) errors.push(`${theme.id}/${ctx.id}: ${fg} / ${bg} = ${r.toFixed(2)}:1 (< ${min[kind]})`);
    }
  }
}

console.log(rows.join('\n'));
if (errors.length) {
  console.error(`\n${errors.length} hata:\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log('\nTüm kurallar geçti.');
