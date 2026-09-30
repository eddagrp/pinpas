// Figma Plugin API script'i: dosyadaki değişkenleri DTCG biçiminde döndürür.
// Figma MCP (use_figma), bir geliştirme plugin'i veya Scripter ile çalıştırılır; çıktı JSON bir dosyaya kaydedilir ve
//   npm run figma:apply-export -- <dosya.json>
// ile repo'ya uygulanır. Figma REST Variables API yalnızca Enterprise planda olduğu için bu yol seçildi.
const toHex = ({ r, g, b, a }) => {
  const h = (x) => Math.round(x * 255).toString(16).padStart(2, '0').toUpperCase();
  return `#${h(r)}${h(g)}${h(b)}${a !== undefined && a < 1 ? h(a) : ''}`;
};
const typeOf = (v) => {
  if (v.resolvedType === 'COLOR') return 'color';
  if (v.resolvedType === 'STRING') return 'fontFamily';
  return v.scopes.includes('FONT_WEIGHT') || v.name.startsWith('font/weight/') ? 'fontWeight' : 'dimension';
};

const collections = await figma.variables.getLocalVariableCollectionsAsync();
const vars = await figma.variables.getLocalVariablesAsync();
const byId = new Map(vars.map((v) => [v.id, v]));
const out = {};
for (const col of collections) {
  const modeId = col.defaultModeId;
  out[col.name] = vars
    .filter((v) => v.variableCollectionId === col.id)
    .map((v) => {
      const raw = v.valuesByMode[modeId];
      let value;
      if (raw && raw.type === 'VARIABLE_ALIAS') {
        const target = byId.get(raw.id);
        value = target ? `{${target.name.split('/').join('.')}}` : null;
      } else if (v.resolvedType === 'COLOR') value = toHex(raw);
      else value = raw;
      return { path: v.name.split('/'), type: typeOf(v), value, description: v.description || undefined };
    });
}
return { exportedAt: new Date().toISOString(), file: figma.root.name, collections: out };
