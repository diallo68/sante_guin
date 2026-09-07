import { describe, it, expect } from 'vitest';
import { GET as getFavorites, POST as toggleFavorite } from '@/app/api/favorites/route';
import Laboratory from '@/models/Laboratory';
import { createUser, authedRequest } from '../helpers';

// Régression B14 : le type 'laboratory' n'était pas géré, alors que le
// schéma User.favorites.laboratories existait déjà — le frontend
// laboratoire envoyait ce type sans jamais réussir.
describe('POST/GET /api/favorites — laboratoires (B14)', () => {
  it('ajoute puis retire un laboratoire des favoris', async () => {
    const { token } = await createUser();
    const lab = await Laboratory.create({ name: 'Labo Test', city: 'Conakry', address: 'Rue 1' });

    const addRes = await toggleFavorite(authedRequest('http://localhost/api/favorites', token, {
      method: 'POST',
      body: JSON.stringify({ type: 'laboratory', targetId: lab._id.toString() }),
    }));
    expect(addRes.status).toBe(200);
    expect((await addRes.json()).favorited).toBe(true);

    const listRes = await getFavorites(authedRequest('http://localhost/api/favorites', token));
    const listBody = await listRes.json();
    expect(listBody.laboratoryIds.map(String)).toContain(lab._id.toString());
    expect(listBody.laboratories).toHaveLength(1);

    const removeRes = await toggleFavorite(authedRequest('http://localhost/api/favorites', token, {
      method: 'POST',
      body: JSON.stringify({ type: 'laboratory', targetId: lab._id.toString() }),
    }));
    expect((await removeRes.json()).favorited).toBe(false);
  });

  it('refuse un type inconnu', async () => {
    const { token } = await createUser();
    const res = await toggleFavorite(authedRequest('http://localhost/api/favorites', token, {
      method: 'POST',
      body: JSON.stringify({ type: 'hospital', targetId: '507f1f77bcf86cd799439011' }),
    }));
    expect(res.status).toBe(400);
  });
});
