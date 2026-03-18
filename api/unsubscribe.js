import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export default async function handler(req, res) {
  const { id, token } = req.query;

  if (!id || !token) {
    return res.status(400).send(page('Lien invalide', 'Paramètres manquants.'));
  }

  const raw = await redis.get(`sub:${id}`);
  if (!raw) {
    return res.status(404).send(page('Non trouvé', 'Cet abonnement n\'existe pas ou a déjà été supprimé.'));
  }

  const sub = typeof raw === 'string' ? JSON.parse(raw) : raw;
  if (sub.token !== token) {
    return res.status(403).send(page('Accès refusé', 'Token invalide.'));
  }

  await redis.del(`sub:${id}`);
  await redis.srem('subscribers', id);

  return res.status(200).send(page('Désabonné', 'Vous ne recevrez plus de notifications AlertAroundMe.'));
}

function page(title, message) {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} — AlertAroundMe</title>
<style>body{font-family:system-ui,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#f9fafb}
.card{background:#fff;padding:2rem;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.1);text-align:center;max-width:400px}
h1{font-size:1.5rem;margin-bottom:.5rem}p{color:#6b7280}</style>
</head><body><div class="card"><h1>${title}</h1><p>${message}</p></div></body></html>`;
}
