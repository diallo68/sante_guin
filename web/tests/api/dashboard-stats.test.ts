import { describe, it, expect } from 'vitest';
import { GET as getDashboard } from '@/app/api/pro/dashboard/route';
import { GET as listPatients } from '@/app/api/pro/patients/route';
import Appointment from '@/models/Appointment';
import { createUser, createDoctor, authedRequest } from '../helpers';

// Régression B28 : "rendez-vous ce mois-ci" n'avait pas de borne
// supérieure et incluait donc aussi tous les rendez-vous des mois futurs.
describe('GET /api/pro/dashboard — borne du mois (B28)', () => {
  it('ne compte pas un rendez-vous du mois prochain dans "ce mois-ci"', async () => {
    const { doctor, token } = await createDoctor();
    const { user: patient } = await createUser({ email: 'patient@test.local' });

    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 15);

    await Appointment.create({
      patientId: patient._id, doctorId: doctor._id,
      date: nextMonth, time: '10:00', status: 'confirmed',
    });

    const res = await getDashboard(authedRequest('http://localhost/api/pro/dashboard', token));
    const body = await res.json();
    expect(body.stats.monthAppointments).toBe(0);
  });

  it('compte bien un rendez-vous du mois courant', async () => {
    const { doctor, token } = await createDoctor();
    const { user: patient } = await createUser({ email: 'patient2@test.local' });

    await Appointment.create({
      patientId: patient._id, doctorId: doctor._id,
      date: new Date(), time: '10:00', status: 'confirmed',
    });

    const res = await getDashboard(authedRequest('http://localhost/api/pro/dashboard', token));
    const body = await res.json();
    expect(body.stats.monthAppointments).toBe(1);
  });

  it('n\'inclut pas de stats pour un pharmacien (pas de rendez-vous dans ce système)', async () => {
    const { token } = await createUser({ role: 'pharmacist' });
    const res = await getDashboard(authedRequest('http://localhost/api/pro/dashboard', token));
    const body = await res.json();
    expect(body.stats).toBeUndefined();
    expect(body.role).toBe('pharmacist');
  });
});

// Régression B28 : `$last` dans un `$group` sans `$sort` préalable ne
// garantit pas de récupérer le rendez-vous le plus récent.
describe('GET /api/pro/patients — dernier motif/statut réellement le plus récent (B28)', () => {
  it('lastReason correspond au rendez-vous le plus récent, pas au dernier inséré', async () => {
    const { doctor, token } = await createDoctor();
    const { user: patient } = await createUser({ email: 'patient3@test.local' });

    const older = new Date(Date.now() - 10 * 86400000);
    const newer = new Date(Date.now() - 1 * 86400000);

    // Insérés dans un ordre différent de l'ordre chronologique.
    await Appointment.create({
      patientId: patient._id, doctorId: doctor._id, date: newer, time: '09:00', reason: 'Motif récent',
    });
    await Appointment.create({
      patientId: patient._id, doctorId: doctor._id, date: older, time: '09:00', reason: 'Motif ancien',
    });

    const res = await listPatients(authedRequest('http://localhost/api/pro/patients', token));
    const body = await res.json();
    const entry = body.patients.find((p: any) => String(p._id) === String(patient._id));
    expect(entry.lastReason).toBe('Motif récent');
  });
});
