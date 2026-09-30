// Token kaynağını okur, alias'ları çözer. Build, verify ve Figma script'leri bunu kullanır.
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const SRC = join(ROOT, 'src');

// Figma koleksiyonu <-> kaynak dosya. Figma'da her koleksiyon 1 mod (Starter plan sınırı),
// bu yüzden tema ve bağlam modlar yerine ayrı koleksiyonlarla ifade ediliyor.
export const COLLECTIONS = [
  { name: 'Primitives', file: 'core/primitives.json', layer: 'core' },
  { name: 'Semantic', file: 'core/semantic.json', layer: 'core' },
  ...listDir('themes').map((f) => ({ name: `Theme/${cap(f)}`, file: `themes/${f}.json`, layer: 'theme', id: f })),
  ...listDir('contexts').map((f) => ({ name: `Context/${cap(f)}`, file: `contexts/${f}.json`, layer: 'context', id: f })),
];

export const themes = () => COLLECTIONS.filter((c) => c.layer === 'theme');
export const contexts = () => COLLECTIONS.filter((c) => c.layer === 'context');

function listDir(sub) {
  return readdirSync(join(SRC, sub)).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, '')).sort();
}
function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function readJson(file) {
  return JSON.parse(readFileSync(join(SRC, file), 'utf8'));
}

// DTCG ağacını düz listeye çevirir. $type üst gruptan miras alınır.
export function flatten(tree, path = [], inheritedType) {
  const out = [];
  const type = tree.$type ?? inheritedType;
  for (const [key, node] of Object.entries(tree)) {
    if (key.startsWith('$')) continue;
    if (node && typeof node === 'object' && '$value' in node) {
      out.push({ path: [...path, key], value: node.$value, type: node.$type ?? type, description: node.$description });
    } else if (node && typeof node === 'object') {
      out.push(...flatten(node, [...path, key], type));
    }
  }
  return out;
}

export function loadCollection(c) {
  return flatten(readJson(c.file)).map((t) => ({ ...t, collection: c.name }));
}

const ALIAS = /^\{([^}]+)\}$/;
export const aliasTarget = (v) => (typeof v === 'string' && ALIAS.test(v) ? v.match(ALIAS)[1] : null);

// Tek bir tema + bağlam kombinasyonu için çözülmüş token seti.
export function resolveSet(themeId, contextId) {
  const picked = COLLECTIONS.filter(
    (c) => c.layer === 'core' || (c.layer === 'theme' && c.id === themeId) || (c.layer === 'context' && c.id === contextId),
  );
  const tokens = picked.flatMap(loadCollection);
  const byName = new Map();
  for (const t of tokens) {
    const name = t.path.join('.');
    if (byName.has(name)) throw new Error(`Çakışan token: ${name} (${byName.get(name).collection} ve ${t.collection})`);
    byName.set(name, t);
  }
  const resolve = (t, seen = []) => {
    const target = aliasTarget(t.value);
    if (!target) return t.value;
    if (seen.includes(target)) throw new Error(`Döngüsel alias: ${[...seen, target].join(' -> ')}`);
    const ref = byName.get(target);
    if (!ref) throw new Error(`Bulunamayan alias: ${t.path.join('.')} -> {${target}}`);
    return resolve(ref, [...seen, target]);
  };
  return tokens.map((t) => ({ ...t, resolved: resolve(t) }));
}
