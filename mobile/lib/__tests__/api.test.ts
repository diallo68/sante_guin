// Régression RA-11 : aucun test n'existait sur le client API mobile.
// Couvre ce que audit RA-02 et B25 ont introduit : l'en-tête
// X-Client-Platform (pour que le serveur sache renvoyer le JWT dans le
// corps JSON, le mobile n'ayant pas de cookie), l'ajout automatique du
// Bearer token, et le déclenchement de triggerUnauthorized() sur un 401.
import { describe, it, expect, vi, beforeEach } from 'vitest';

const getTokenMock = vi.fn(async () => null as string | null);
vi.mock('@/lib/auth', () => ({ getToken: getTokenMock }));

const triggerUnauthorizedMock = vi.fn();
vi.mock('@/lib/authEvents', () => ({ triggerUnauthorized: triggerUnauthorizedMock }));

describe('lib/api (mobile)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getTokenMock.mockResolvedValue(null);
  });

  it("envoie X-Client-Platform: mobile par défaut sur le client, dès sa création", async () => {
    const { default: api } = await import('@/lib/api');
    expect(api.defaults.headers['X-Client-Platform']).toBe('mobile');
  });

  it("ajoute l'en-tête Authorization quand un token est stocké", async () => {
    getTokenMock.mockResolvedValue('abc123');
    const { default: api } = await import('@/lib/api');

    const config = await api.interceptors.request.handlers![0]!.fulfilled!({ headers: {} } as any);
    expect(config.headers.Authorization).toBe('Bearer abc123');
  });

  it("n'ajoute pas d'en-tête Authorization sans token stocké", async () => {
    getTokenMock.mockResolvedValue(null);
    const { default: api } = await import('@/lib/api');

    const config = await api.interceptors.request.handlers![0]!.fulfilled!({ headers: {} } as any);
    expect(config.headers.Authorization).toBeUndefined();
  });

  it('déclenche triggerUnauthorized() sur une réponse 401', async () => {
    const { default: api } = await import('@/lib/api');
    const rejected = api.interceptors.response.handlers![0]!.rejected!;

    await expect(rejected({ response: { status: 401 } })).rejects.toBeTruthy();
    expect(triggerUnauthorizedMock).toHaveBeenCalledOnce();
  });

  it('ne déclenche pas triggerUnauthorized() sur une autre erreur (ex. 500)', async () => {
    const { default: api } = await import('@/lib/api');
    const rejected = api.interceptors.response.handlers![0]!.rejected!;

    await expect(rejected({ response: { status: 500 } })).rejects.toBeTruthy();
    expect(triggerUnauthorizedMock).not.toHaveBeenCalled();
  });

  it('ne déclenche pas triggerUnauthorized() sur une erreur réseau sans réponse (hors-ligne)', async () => {
    const { default: api } = await import('@/lib/api');
    const rejected = api.interceptors.response.handlers![0]!.rejected!;

    await expect(rejected({ response: undefined })).rejects.toBeTruthy();
    expect(triggerUnauthorizedMock).not.toHaveBeenCalled();
  });
});
