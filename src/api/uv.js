const UV_LEVELS = [
  { max: 2, label: 'Faible', color: 'green', severity: 'none' },
  { max: 5, label: 'Modéré', color: 'gold', severity: 'none' },
  { max: 7, label: 'Élevé', color: 'orange', severity: 'info' },
  { max: 10, label: 'Très élevé', color: 'red', severity: 'warning' },
  { max: Infinity, label: 'Extrême', color: 'violet', severity: 'danger' },
];

function getUvLevel(uv) {
  return UV_LEVELS.find((l) => uv <= l.max);
}

export async function fetchUv(lat, lon) {
  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=uv_index,uv_index_clear_sky`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo Air Quality HTTP ${res.status}`);
  const data = await res.json();

  const uv = data.current.uv_index;
  const uvClear = data.current.uv_index_clear_sky;
  const level = getUvLevel(uv);

  return {
    hasAlert: uv > 7,
    severity: level.severity,
    summary: `UV ${uv.toFixed(1)} — ${level.label}${uvClear > uv + 2 ? ` (potentiel ${uvClear.toFixed(1)} ciel dégagé)` : ''}.`,
    details: { uv, uvClear, color: level.color },
  };
}
