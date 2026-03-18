import { Redis } from '@upstash/redis';
import crypto from 'crypto';

const redis = Redis.fromEnv();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, latitude, longitude, communeName } = req.body;

  if (!email || !latitude || !longitude) {
    return res.status(400).json({ error: 'Email et position requis.' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Email invalide.' });
  }

  const id = crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex').slice(0, 16);
  const token = crypto.randomBytes(16).toString('hex');

  await redis.set(`sub:${id}`, JSON.stringify({
    email: email.toLowerCase().trim(),
    lat: latitude,
    lon: longitude,
    communeName: communeName || null,
    token,
    lastState: null,
    createdAt: new Date().toISOString(),
  }));

  await redis.sadd('subscribers', id);

  return res.status(200).json({ ok: true, message: 'Abonnement enregistré.' });
}
