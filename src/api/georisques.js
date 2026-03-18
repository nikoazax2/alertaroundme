async function resolveInsee(lat, lon) {
  const url = `https://geo.api.gouv.fr/communes?lat=${lat}&lon=${lon}&fields=code,nom`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`geo.api.gouv.fr HTTP ${res.status}`);
  const communes = await res.json();
  if (!communes.length) return null;
  return { code: communes[0].code, nom: communes[0].nom };
}

export async function fetchGeorisques(lat, lon) {
  const commune = await resolveInsee(lat, lon);
  if (!commune) {
    return {
      hasAlert: false,
      severity: 'none',
      summary: 'Hors France — données radon indisponibles.',
      details: null,
    };
  }

  const url = `https://georisques.gouv.fr/api/v1/radon?code_insee=${commune.code}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Géorisques HTTP ${res.status}`);
  const data = await res.json();

  if (!data.data || data.data.length === 0) {
    return {
      hasAlert: false,
      severity: 'none',
      summary: `Aucune donnée radon pour ${commune.nom}.`,
      details: null,
    };
  }

  const category = data.data[0].classe_potentiel;
  const severityMap = { 1: 'none', 2: 'info', 3: 'warning' };
  const labelMap = { 1: 'faible', 2: 'moyen', 3: 'élevé' };

  return {
    hasAlert: category >= 2,
    severity: severityMap[category] || 'info',
    summary: `Potentiel radon ${labelMap[category] || category} à ${commune.nom}.`,
    details: { commune: commune.nom, codeInsee: commune.code, category },
  };
}
