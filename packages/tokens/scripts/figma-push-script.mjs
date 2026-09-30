// Kaynak token'ları Figma değişkenlerine yazan bir Plugin API script'i üretir: dist/figma/push-<tema>.js
// Yalnızca ilk kurulum (seed) ve Figma dosyasını sıfırdan yeniden kurmak için kullanılır.
// Günlük akış tersi yöndedir: Figma → export-variables.js → figma-apply-export.mjs → repo.
//
// Script idempotent: koleksiyon/değişken varsa günceller, yoksa oluşturur; kaynağında olmayan değişkenleri silmez, raporlar.
// Figma Starter planında koleksiyon başına 1 mod olduğundan bir Figma dosyası tek bir temayı taşır.
//
// Kullanım: node scripts/figma-push-script.mjs [tema=pinpas]
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, COLLECTIONS, loadCollection, aliasTarget } from '../lib/tokens.mjs';

const themeId = process.argv[2] ?? 'pinpas';
const picked = COLLECTIONS.filter((c) => c.layer !== 'theme' || c.id === themeId);
if (!picked.some((c) => c.layer === 'theme')) throw new Error(`Tema bulunamadı: ${themeId}`);

const FIGMA_TYPE = { color: 'COLOR', dimension: 'FLOAT', fontWeight: 'FLOAT', fontFamily: 'STRING', number: 'FLOAT' };

// Değişken hangi özellik seçicilerinde görünsün. Primitive'ler gizli: tasarımcı semantic katmanı kullanır.
function scopesFor(c, t) {
  if (c.name === 'Primitives') return [];
  const p = t.path.join('/');
  if (t.type === 'color') {
    if (/^color\/(bg|status\/\w+\/bg)|\/bg(-pressed)?$/.test(p)) return ['FRAME_FILL', 'SHAPE_FILL'];
    if (/^color\/text\//.test(p)) return ['TEXT_FILL'];
    if (/^color\/border\/|\/border$/.test(p)) return ['STROKE_COLOR'];
    if (/\/fg$/.test(p)) return ['TEXT_FILL', 'SHAPE_FILL', 'STROKE_COLOR'];
    return ['ALL_FILLS', 'STROKE_COLOR'];
  }
  if (t.type === 'fontWeight') return ['FONT_WEIGHT'];
  if (t.type === 'fontFamily') return ['FONT_FAMILY'];
  if (/^font\/size\//.test(p)) return ['FONT_SIZE'];
  if (/^radius\//.test(p)) return ['CORNER_RADIUS'];
  if (/^space\//.test(p)) return ['GAP'];
  if (/^border\/.*width/.test(p)) return ['STROKE_FLOAT'];
  if (/^size\//.test(p)) return ['WIDTH_HEIGHT'];
  return [];
}


const data = picked.map((c) => ({
  name: c.name,
  layer: c.layer,
  tokens: loadCollection(c).map((t) => {
    const alias = aliasTarget(t.value);
    return {
      name: t.path.join('/'),
      type: FIGMA_TYPE[t.type] ?? (() => { throw new Error(`Bilinmeyen $type: ${t.type} (${t.path.join('.')})`); })(),
      alias: alias ? alias.split('.').join('/') : null,
      value: alias ? null : t.value,
      scopes: scopesFor(c, t),
      web: `var(--${t.path.join('-')})`,
      description: t.description ?? '',
    };
  }),
}));

const script = `// Otomatik üretildi: packages/tokens/scripts/figma-push-script.mjs (tema: ${themeId})
const DATA = ${JSON.stringify(data)};
const existing = await figma.variables.getLocalVariableCollectionsAsync();
const allVars = await figma.variables.getLocalVariablesAsync();
const report = { created: 0, updated: 0, extra: [], collections: {} };
const byCollection = {};
for (const def of DATA) {
  let col = existing.find((c) => c.name === def.name);
  if (!col) col = figma.variables.createVariableCollection(def.name);
  const modeId = col.modes[0].modeId;
  if (col.modes[0].name !== 'Value') col.renameMode(modeId, 'Value');
  const vars = new Map(allVars.filter((v) => v.variableCollectionId === col.id).map((v) => [v.name, v]));
  byCollection[def.name] = { col, modeId, vars };
  for (const t of def.tokens) {
    let v = vars.get(t.name);
    if (v && v.resolvedType !== t.type) { v.remove(); v = null; }
    if (!v) { v = figma.variables.createVariable(t.name, col, t.type); vars.set(t.name, v); report.created++; } else report.updated++;
    v.scopes = t.scopes;
    v.description = t.description;
    v.setVariableCodeSyntax('WEB', t.web);
    if (!t.alias) v.setValueForMode(modeId, t.type === 'COLOR' ? figma.util.rgba(t.value) : t.value);
  }
  const names = new Set(def.tokens.map((t) => t.name));
  for (const name of vars.keys()) if (!names.has(name)) report.extra.push(def.name + ': ' + name);
  report.collections[def.name] = { id: col.id, count: def.tokens.length };
}
// Alias'lar: bağlamlar ve semantic -> tema/primitive; tema -> primitive. Bağlam koleksiyonları hedef olamaz.
const targets = DATA.filter((d) => d.layer !== 'context').map((d) => byCollection[d.name]);
for (const def of DATA) {
  const { modeId, vars } = byCollection[def.name];
  for (const t of def.tokens) {
    if (!t.alias) continue;
    const hit = targets.map((c) => c.vars.get(t.alias)).find(Boolean);
    if (!hit) throw new Error('Alias hedefi yok: ' + def.name + ' ' + t.name + ' -> ' + t.alias);
    vars.get(t.name).setValueForMode(modeId, { type: 'VARIABLE_ALIAS', id: hit.id });
  }
}
return report;
`;

const outDir = join(ROOT, 'dist', 'figma');
mkdirSync(outDir, { recursive: true });
const out = join(outDir, `push-${themeId}.js`);
writeFileSync(out, script);
console.log(`✓ ${out} (${script.length} karakter, ${data.reduce((n, c) => n + c.tokens.length, 0)} değişken)`);
