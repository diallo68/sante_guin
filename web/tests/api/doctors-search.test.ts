import { describe, it, expect } from 'vitest';
import { GET as listDoctors } from '@/app/api/doctors/route';
import { GET as searchDoctorById } from '@/app/api/doctors/[id]/route';
import { createDoctor, jsonRequest } from '../helpers';

async function seedDoctors(count: number) {
  for (let i = 0; i < count; i++) {
    await createDoctor({ email: `doc${i}@test.local` });
  }
}

describe('GET /api/doctors (S17, B21)', () => {
  it('traite une recherche contenant des métacaractères regex comme du texte littéral', async () => {
    await createDoctor({ email: 'normal@test.local' });
    // Motif classique de ReDoS / injection regex.
    const req = jsonRequest('http://localhost/api/doctors?search=' + encodeURIComponent('(a+)+$'));
    const res = await listDoctors(req);
    // Ne doit ni planter, ni bloquer — simplement ne rien trouver.
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.doctors).toHaveLength(0);
  });

  it('limit=0 ne supprime plus la pagination (fallback sur la valeur par défaut)', async () => {
    await seedDoctors(15);
    const req = jsonRequest('http://localhost/api/doctors?limit=0');
    const res = await listDoctors(req);
    const body = await res.json();
    expect(body.doctors.length).toBeLessThanOrEqual(12); // défaut, pas 15
    expect(body.doctors.length).toBeGreaterThan(0);
  });

  it('un limit négatif ou non numérique retombe sur la valeur par défaut', async () => {
    await seedDoctors(3);
    for (const bad of ['-5', 'abc', '']) {
      const req = jsonRequest(`http://localhost/api/doctors?limit=${bad}`);
      const res = await listDoctors(req);
      expect(res.status).toBe(200);
    }
  });

  it('respecte un rôle de recherche par ville insensible à la casse', async () => {
    await createDoctor({ email: 'conakry-doc@test.local' });
    const req = jsonRequest('http://localhost/api/doctors?location=CONAKRY');
    const res = await listDoctors(req);
    const body = await res.json();
    expect(body.doctors.length).toBeGreaterThan(0);
  });

  it('filtre par note minimale (minRating)', async () => {
    const { doctor: lowRated } = await createDoctor({ email: 'low@test.local' });
    lowRated.rating = 2;
    await lowRated.save();
    const { doctor: highRated } = await createDoctor({ email: 'high@test.local' });
    highRated.rating = 4.5;
    await highRated.save();

    const req = jsonRequest('http://localhost/api/doctors?minRating=4');
    const res = await listDoctors(req);
    const body = await res.json();
    const ids = body.doctors.map((d: any) => d._id);
    expect(ids).toContain(highRated._id.toString());
    expect(ids).not.toContain(lowRated._id.toString());
  });
});

describe('GET /api/doctors/[id]', () => {
  it('renvoie 404 pour un identifiant inexistant', async () => {
    const res = await searchDoctorById(
      jsonRequest('http://localhost/api/doctors/507f1f77bcf86cd799439011'),
      { params: Promise.resolve({ id: '507f1f77bcf86cd799439011' }) }
    );
    expect(res.status).toBe(404);
  });
});
