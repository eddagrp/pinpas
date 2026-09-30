// Figma export'unu (figma/export-variables.js çıktısı) repo'daki kaynak dosyalara uygular.
// Dosya düzeni, grup $type'ları ve $description'lar korunur; yalnızca değerler değişir.
//
//   node scripts/figma-apply-export.mjs <export.json>           değişiklikleri yazar
//   node scripts/figma-apply-export.mjs <export.json> --check   yalnızca fark raporlar, fark varsa exit 1 (CI drift kontrolü)
//   node scripts/figma-apply-export.mjs <export.json> --prune   Figma'da silinmiş token'ları repo'dan da siler
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { SRC, COLLECTIONS, readJson, flatten } from '../lib/tokens.mjs';

const [file, ...flags] = process.argv.slice(2);
if (!file) throw new Error('Kullanım: figma-apply-export.mjs <export.json> [--check] [--prune]');
const check = flags.includes('--check');
const prune = flags.includes('--prune');
const exported = JSON.parse(readFileSync(file, 'utf8')).collections;

const changes = [];
for (const [name, tokens] of Object.entries(exported)) {
  const c = COLLECTIONS.find((x) => x.name === name);
  if (!c) {
    changes.push(`? Figma koleksiyonu repo'da karşılıksız: ${name} (yeni tema/bağlam ise önce src altına dosyasını ekleyin)`);
    continue;
  }
  const tree = readJson(c.file);
  const current = new Map(flatten(tree).map((t) => [t.path.join('.'), t]));
  let dirty = false;

  for (const t of tokens) {
    const key = t.path.join('.');
    const cur = current.get(key);
    current.delete(key);
    if (cur && sameValue(cur.value, t.value)) continue;
    changes.push(cur ? `~ ${name}: ${key}  ${cur.value} → ${t.value}` : `+ ${name}: ${key} = ${t.value}`);
    let node = tree;
    for (const k of t.path.slice(0, -1)) node = node[k] ??= {};
    const leaf = (node[t.path.at(-1)] ??= {});
    leaf.$value = t.value;
    if (!cur && t.type !== inheritedType(tree, t.path)) leaf.$type = t.type;
    if (!cur && t.description) leaf.$description = t.description;
    dirty = true;
  }
  for (const key of current.keys()) {
    changes.push(`- ${name}: ${key} Figma'da yok${prune ? ' (siliniyor)' : ' (--prune ile silinir)'}`);
    if (prune) {
      const path = key.split('.');
      let node = tree;
      for (const k of path.slice(0, -1)) node = node[k];
      delete node[path.at(-1)];
      dirty = true;
    }
  }
  if (dirty && !check) writeFileSync(join(SRC, c.file), JSON.stringify(tree, null, 2) + '\n');
}

console.log(changes.length ? changes.join('\n') : 'Figma ile repo aynı.');
if (check && changes.length) process.exit(1);

function sameValue(a, b) {
  return typeof a === 'string' && typeof b === 'string' ? a.toUpperCase() === b.toUpperCase() : a === b;
}
function inheritedType(tree, path) {
  let type = tree.$type;
  let node = tree;
  for (const k of path.slice(0, -1)) {
    node = node?.[k];
    type = node?.$type ?? type;
  }
  return type;
}
