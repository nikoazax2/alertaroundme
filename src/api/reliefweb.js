async function getCountryName(lat, lon) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=3&addressdetails=1&accept-language=en`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'AlertAroundMe/1.0' },
  });
  if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`);
  const data = await res.json();
  return data.address?.country || null;
}

export async function fetchReliefWeb(lat, lon) {
  const country = await getCountryName(lat, lon);
  if (!country) {
    return {
      hasAlert: false,
      severity: 'none',
      summary: 'Pays non identifié.',
      details: null,
    };
  }

  const keywords = `(war OR "armed conflict" OR "terror attack" OR bombing OR evacuation OR "state of emergency" OR epidemic OR famine)`;
  const query = encodeURIComponent(`${keywords} "${country}"`);
  const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${query}&mode=ArtList&maxrecords=5&format=json&TIMESPAN=3d&sort=DateDesc`;

  const res = await fetch(url);
  if (res.status === 429) {
    throw new Error('Limite de requêtes GDELT atteinte, réessayez dans quelques secondes.');
  }
  if (!res.ok) throw new Error(`GDELT HTTP ${res.status}`);

  const data = await res.json();
  const articles = data.articles || [];

  if (articles.length === 0) {
    return {
      hasAlert: false,
      severity: 'none',
      summary: `Aucune actualité crise récente détectée (${country}).`,
      details: null,
    };
  }

  return {
    hasAlert: articles.length >= 3,
    severity: articles.length >= 4 ? 'warning' : 'info',
    summary: `${articles.length} mention(s) de crise en ${country} (3 derniers jours).`,
    details: articles.map((a) => ({
      title: a.title?.trim(),
      source: a.domain,
      date: a.seendate,
    })),
  };
}
