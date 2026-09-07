import { describe, it, expect } from 'vitest';
import { POST as deleteRequest } from '@/app/api/account/delete-request/route';
import DeletionRequest from '@/models/DeletionRequest';
import { jsonRequest } from '../helpers';

// Régression B19 : sans SendGrid configuré (ou en cas d'échec d'envoi), la
// demande de suppression était perdue sans aucune trace, tout en
// répondant un succès à l'utilisateur.
describe('POST /api/account/delete-request (B19)', () => {
  it('persiste la demande même si aucun email n\'a pu être envoyé', async () => {
    const res = await deleteRequest(jsonRequest('http://localhost/api/account/delete-request', {
      method: 'POST',
      body: JSON.stringify({ name: 'Jean Dupont', email: 'jean@test.local' }),
    }));
    expect(res.status).toBe(200);

    const stored = await DeletionRequest.findOne({ email: 'jean@test.local' });
    expect(stored).not.toBeNull();
    expect(stored?.name).toBe('Jean Dupont');
    // SENDGRID_API_KEY n'est pas configuré dans l'environnement de test.
    expect(stored?.emailSent).toBe(false);
  });

  it('échappe un nom contenant des balises HTML dans l\'email (mais le persiste tel quel)', async () => {
    const res = await deleteRequest(jsonRequest('http://localhost/api/account/delete-request', {
      method: 'POST',
      body: JSON.stringify({ name: '<img src=x onerror=alert(1)>', email: 'attacker@test.local' }),
    }));
    expect(res.status).toBe(200);
    const stored = await DeletionRequest.findOne({ email: 'attacker@test.local' });
    expect(stored?.name).toBe('<img src=x onerror=alert(1)>');
  });

  it('refuse une requête sans nom ni email', async () => {
    const res = await deleteRequest(jsonRequest('http://localhost/api/account/delete-request', {
      method: 'POST',
      body: JSON.stringify({}),
    }));
    expect(res.status).toBe(400);
  });
});
