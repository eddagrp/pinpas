// Her tema × bağlam için çıktı üretir:
//   dist/<tema>/<bağlam>.css   web (CSS custom properties, px)
//   dist/<tema>/<bağlam>.ts    React Native / TS (iç içe nesne, birimsiz sayılar)
//   dist/<tema>/<bağlam>.json  düz liste (araçlar ve testler için)
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, themes, contexts, resolveSet } from '../lib/tokens.mjs';

const DIST = join(ROOT, 'dist');
rmSync(DIST, { recursive: true, force: true });

const cssName = (path) => `--${path.join('-')}`;
const cssValue = (t) => {
  if (t.type === 'dimension') return t.resolved === 0 ? '0' : `${t.resolved}px`;
  if (t.type === 'fontFamily') return `"${t.resolved}", system-ui, sans-serif`;
  return String(t.resolved);
};

function nest(tokens) {
  const root = {};
  for (const t of tokens) {
    let node = root;
    t.path.slice(0, -1).forEach((k) => (node = node[k] ??= {}));
    node[t.path.at(-1)] = t.resolved;
  }
  return root;
}

const header = (theme, ctx) =>
  `Otomatik üretildi — elle düzenlemeyin. Kaynak: packages/tokens/src (tema: ${theme}, bağlam: ${ctx})`;

let count = 0;
for (const theme of themes()) {
  for (const ctx of contexts()) {
    const set = resolveSet(theme.id, ctx.id);
    const dir = join(DIST, theme.id);
    mkdirSync(dir, { recursive: true });

    const css = [`/* ${header(theme.id, ctx.id)} */`, ':root {']
      .concat(set.map((t) => `  ${cssName(t.path)}: ${cssValue(t)};`))
      .concat('}', '')
      .join('\n');
    writeFileSync(join(dir, `${ctx.id}.css`), css);

    const ts = `// ${header(theme.id, ctx.id)}\nexport const tokens = ${JSON.stringify(nest(set), null, 2)} as const;\n\nexport type Tokens = typeof tokens;\n`;
    writeFileSync(join(dir, `${ctx.id}.ts`), ts);

    const flat = Object.fromEntries(set.map((t) => [t.path.join('.'), t.resolved]));
    writeFileSync(join(dir, `${ctx.id}.json`), JSON.stringify(flat, null, 2) + '\n');

    console.log(`✓ ${theme.id}/${ctx.id}: ${set.length} token`);
    count++;
  }
}
console.log(`${count} kombinasyon üretildi → ${DIST}`);
