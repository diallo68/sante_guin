import { describe, it, expect } from 'vitest';
import { POST as uploadDocument } from '@/app/api/pro/documents/route';
import { GET as downloadDocument } from '@/app/api/pro/documents/[id]/download/route';
import { createDoctor, authedRequest, jsonRequest } from '../helpers';

function jpeg(): File {
  return new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0])], 'doc.jpg', { type: 'image/jpeg' });
}

// Régression S06 : les documents étaient stockés dans `public/uploads` et
// servis par une URL statique directe, sans aucun contrôle d'accès.
describe('GET /api/pro/documents/[id]/download (S06)', () => {
  it('refuse le téléchargement sans authentification ni jeton', async () => {
    const { token } = await createDoctor();
    const form = new FormData();
    form.append('file', jpeg());
    const uploadRes = await uploadDocument(authedRequest('http://localhost/api/pro/documents', token, {
      method: 'POST', body: form,
    }));
    const { document } = await uploadRes.json();
    const docId = document.id;

    const res = await downloadDocument(
      jsonRequest(`http://localhost/api/pro/documents/${docId}/download`),
      { params: Promise.resolve({ id: docId }) }
    );
    expect(res.status).toBe(401);
  });

  it('refuse le téléchargement par un autre professionnel (pas le propriétaire)', async () => {
    const { token: ownerToken } = await createDoctor({ email: 'owner@test.local' });
    const form = new FormData();
    form.append('file', jpeg());
    const uploadRes = await uploadDocument(authedRequest('http://localhost/api/pro/documents', ownerToken, {
      method: 'POST', body: form,
    }));
    const { document } = await uploadRes.json();

    const { token: strangerToken } = await createDoctor({ email: 'stranger@test.local' });
    const res = await downloadDocument(
      authedRequest(`http://localhost/api/pro/documents/${document.id}/download`, strangerToken),
      { params: Promise.resolve({ id: document.id }) }
    );
    expect(res.status).toBe(404); // introuvable pour ce compte, pas d'accès
  });

  it('autorise le propriétaire via sa session', async () => {
    const { token } = await createDoctor();
    const form = new FormData();
    form.append('file', jpeg());
    const uploadRes = await uploadDocument(authedRequest('http://localhost/api/pro/documents', token, {
      method: 'POST', body: form,
    }));
    const { document } = await uploadRes.json();

    const res = await downloadDocument(
      authedRequest(`http://localhost/api/pro/documents/${document.id}/download`, token),
      { params: Promise.resolve({ id: document.id }) }
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('content-disposition')).toContain('attachment');
  });

  it('autorise via le jeton signé embarqué dans l\'URL renvoyée par la liste (mobile)', async () => {
    const { token } = await createDoctor();
    const form = new FormData();
    form.append('file', jpeg());
    const uploadRes = await uploadDocument(authedRequest('http://localhost/api/pro/documents', token, {
      method: 'POST', body: form,
    }));
    const { document } = await uploadRes.json();

    // `document.url` contient déjà `?token=...` (voir GET /api/pro/documents).
    const downloadUrl = new URL(document.url);
    const res = await downloadDocument(
      jsonRequest(`http://localhost${downloadUrl.pathname}${downloadUrl.search}`),
      { params: Promise.resolve({ id: document.id }) }
    );
    expect(res.status).toBe(200);
  });
});
