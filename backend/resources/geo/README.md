# Geo reference data

- `countries.json` — supported countries, labels, and whether LGA/district lists are available.
- `ng.json` — Nigeria states and LGAs (generated from `nigeria-state-lga-data`).
- `gh.json`, `ke.json`, `us.json` — partial datasets; free-text fallback is used when a state has no listed LGAs.

Regenerate Nigeria data:

```bash
node -e "const d=require('../node_modules/nigeria-state-lga-data/data/nigeria.json'); const out={states:[],lgas:{}}; for(const s of d.states){ const code=s.name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); out.states.push({code,name:s.name}); out.lgas[code]=s.lgas.sort(); } require('fs').writeFileSync('./ng.json', JSON.stringify(out));"
```

Run from `backend/resources/geo`.
