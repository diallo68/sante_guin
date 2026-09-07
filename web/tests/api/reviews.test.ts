import { describe, it, expect } from 'vitest';
import { GET as listReviews, POST as createReview } from '@/app/api/reviews/route';
import { GET as listProReviews } from '@/app/api/pro/reviews/route';
import Review from '@/models/Review';
import User from '@/models/User';
import { createUser, createDoctor, authedRequest, jsonRequest } from '../helpers';

// Régression B15 : l'API renvoyait `patientId`/`createdAt`, alors que web
// et mobile affichent `patientName`/`date` — les deux champs restaient
// vides à l'écran.
describe('GET/POST /api/reviews — DTO patientName/date (B15)', () => {
  it('POST puis GET renvoient patientName et date, pas patientId/createdAt bruts', async () => {
    const { user, token } = await createUser({ email: 'reviewer@test.local' });
    const { doctor } = await createDoctor();

    const createRes = await createReview(authedRequest('http://localhost/api/reviews', token, {
      method: 'POST',
      body: JSON.stringify({ doctorId: doctor._id.toString(), rating: 5, comment: 'Excellent' }),
    }));
    expect(createRes.status).toBe(201);
    const createBody = await createRes.json();
    expect(createBody.review.patientName).toBe(`${user.firstName} ${user.lastName}`);
    expect(createBody.review.date).toBeTruthy();
    expect(createBody.review.patientId).toBeUndefined();

    const listRes = await listReviews(jsonRequest(`http://localhost/api/reviews?doctorId=${doctor._id}`));
    const listBody = await listRes.json();
    expect(listBody.reviews[0].patientName).toBe(`${user.firstName} ${user.lastName}`);
    expect(listBody.reviews[0].date).toBeTruthy();
  });

  it('refuse un second avis du même patient pour le même médecin', async () => {
    const { token } = await createUser();
    const { doctor } = await createDoctor();

    const first = await createReview(authedRequest('http://localhost/api/reviews', token, {
      method: 'POST',
      body: JSON.stringify({ doctorId: doctor._id.toString(), rating: 4 }),
    }));
    expect(first.status).toBe(201);

    const second = await createReview(authedRequest('http://localhost/api/reviews', token, {
      method: 'POST',
      body: JSON.stringify({ doctorId: doctor._id.toString(), rating: 3 }),
    }));
    expect(second.status).toBe(409);
  });
});

// Régression B17 : `patientId` peuplé devenait `null` si le patient était
// supprimé, et était déréférencé sans contrôle (`.firstName` sur `null`),
// plantant la route.
describe('GET /api/pro/reviews — tolère un patient supprimé (B17)', () => {
  it('ne plante pas quand le patient d\'un avis a été supprimé', async () => {
    const { user: patient } = await createUser({ email: 'to-delete@test.local' });
    const { doctor, token: doctorToken } = await createDoctor();
    await Review.create({ doctorId: doctor._id, patientId: patient._id, rating: 5, comment: 'Top' });

    // Le patient est supprimé (ex. suppression de compte par un admin).
    await User.findByIdAndDelete(patient._id);

    const res = await listProReviews(authedRequest('http://localhost/api/pro/reviews', doctorToken));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.reviews[0].patientName).toBe('Patient supprimé');
  });
});
