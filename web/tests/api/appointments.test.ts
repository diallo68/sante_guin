import { describe, it, expect } from 'vitest';
import { POST as createAppointment } from '@/app/api/appointments/route';
import Appointment from '@/models/Appointment';
import { createUser, createDoctor, authedRequest } from '../helpers';

function futureDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
}

describe('POST /api/appointments', () => {
  it('refuse une date déjà passée', async () => {
    const { token } = await createUser();
    const { doctor } = await createDoctor();

    const req = authedRequest('http://localhost/api/appointments', token, {
      method: 'POST',
      body: JSON.stringify({ doctorId: doctor._id.toString(), date: '2020-01-01', time: '10:00' }),
    });
    const res = await createAppointment(req);
    expect(res.status).toBe(400);
  });

  it('refuse un médecin introuvable', async () => {
    const { token } = await createUser();
    const req = authedRequest('http://localhost/api/appointments', token, {
      method: 'POST',
      body: JSON.stringify({ doctorId: '507f1f77bcf86cd799439011', date: futureDate(1), time: '10:00' }),
    });
    const res = await createAppointment(req);
    expect(res.status).toBe(404);
  });

  it('refuse un médecin marqué indisponible', async () => {
    const { token } = await createUser();
    const { doctor } = await createDoctor();
    doctor.isAvailable = false;
    await doctor.save();

    const req = authedRequest('http://localhost/api/appointments', token, {
      method: 'POST',
      body: JSON.stringify({ doctorId: doctor._id.toString(), date: futureDate(1), time: '10:00' }),
    });
    const res = await createAppointment(req);
    expect(res.status).toBe(409);
  });

  it('refuse une heure mal formée', async () => {
    const { token } = await createUser();
    const { doctor } = await createDoctor();
    const req = authedRequest('http://localhost/api/appointments', token, {
      method: 'POST',
      body: JSON.stringify({ doctorId: doctor._id.toString(), date: futureDate(1), time: '25:99' }),
    });
    const res = await createAppointment(req);
    expect(res.status).toBe(400);
  });

  it('crée un rendez-vous valide avec sa conversation associée', async () => {
    const { token, user } = await createUser();
    const { doctor } = await createDoctor();
    const date = futureDate(2);

    const req = authedRequest('http://localhost/api/appointments', token, {
      method: 'POST',
      body: JSON.stringify({ doctorId: doctor._id.toString(), date, time: '10:00', reason: 'Contrôle' }),
    });
    const res = await createAppointment(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.appointment.patientId).toBe(user._id.toString());
  });

  // Régression B03 : la vérification applicative (find puis create) laissait
  // une fenêtre de course entre deux requêtes concurrentes sur le même
  // créneau. La contrainte unique en base doit empêcher la double
  // réservation même si les deux requêtes arrivent en même temps.
  it('empêche deux réservations concurrentes sur le même créneau', async () => {
    const { token: tokenA } = await createUser({ email: 'patientA@test.local' });
    const { token: tokenB } = await createUser({ email: 'patientB@test.local' });
    const { doctor } = await createDoctor();
    const date = futureDate(3);

    const makeReq = (token: string) => authedRequest('http://localhost/api/appointments', token, {
      method: 'POST',
      body: JSON.stringify({ doctorId: doctor._id.toString(), date, time: '14:00' }),
    });

    const [resA, resB] = await Promise.all([
      createAppointment(makeReq(tokenA)),
      createAppointment(makeReq(tokenB)),
    ]);

    const statuses = [resA.status, resB.status].sort();
    // L'une réussit (201), l'autre est rejetée (409) — jamais les deux à 201.
    expect(statuses).toEqual([201, 409]);

    const count = await Appointment.countDocuments({ doctorId: doctor._id, date: new Date(date), time: '14:00' });
    expect(count).toBe(1);
  });
});
