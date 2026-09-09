// Régression RA-11 : aucun test n'existait sur le stockage de session
// mobile. `react-native` (Platform) et `expo-secure-store` sont mockés —
// leurs modules natifs ne sont pas exécutables sous Node — pour tester la
// logique de lib/auth.ts elle-même : quel store est utilisé selon la
// plateforme, et que le token/utilisateur sont bien écrits/lus/effacés.
import { describe, it, expect, vi, beforeEach } from 'vitest';

const secureStore = {
  setItemAsync: vi.fn(async (_key: string, _value: string) => {}),
  getItemAsync: vi.fn(async (_key: string): Promise<string | null> => null),
  deleteItemAsync: vi.fn(async (_key: string) => {}),
};

// Objet muté (pas réassigné) entre les tests : sa propriété `OS` reste
// lue dynamiquement par lib/auth.ts à chaque appel, contrairement à une
// valeur qui serait figée à l'import.
const RNPlatform = { OS: 'ios' };

vi.mock('expo-secure-store', () => secureStore);
vi.mock('react-native', () => ({ Platform: RNPlatform }));

// localStorage n'existe pas sous Node : lib/auth.ts l'utilise uniquement
// sur Platform.OS === 'web', simulé ici par un mock minimal.
const localStorageMock = {
  store: new Map<string, string>(),
  setItem(key: string, value: string) { this.store.set(key, value); },
  getItem(key: string) { return this.store.get(key) ?? null; },
  removeItem(key: string) { this.store.delete(key); },
};
vi.stubGlobal('localStorage', localStorageMock);

describe('lib/auth (mobile)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.store.clear();
    RNPlatform.OS = 'ios';
  });

  it('sur natif (iOS/Android), passe par expo-secure-store, jamais par localStorage', async () => {
    const { saveToken, getToken, removeToken } = await import('@/lib/auth');
    secureStore.getItemAsync.mockResolvedValueOnce('le-token');

    await saveToken('le-token');
    expect(secureStore.setItemAsync).toHaveBeenCalledWith('gs_token', 'le-token');

    const token = await getToken();
    expect(token).toBe('le-token');
    expect(secureStore.getItemAsync).toHaveBeenCalledWith('gs_token');

    await removeToken();
    expect(secureStore.deleteItemAsync).toHaveBeenCalledWith('gs_token');
    expect(secureStore.deleteItemAsync).toHaveBeenCalledWith('gs_user');
  });

  it('sur web, passe par localStorage, jamais par expo-secure-store (SecureStore indisponible sur web)', async () => {
    RNPlatform.OS = 'web';
    const { saveToken, getToken, removeToken } = await import('@/lib/auth');

    await saveToken('web-token');
    expect(localStorageMock.getItem('gs_token')).toBe('web-token');
    expect(secureStore.setItemAsync).not.toHaveBeenCalled();

    const token = await getToken();
    expect(token).toBe('web-token');
    expect(secureStore.getItemAsync).not.toHaveBeenCalled();

    await removeToken();
    expect(localStorageMock.getItem('gs_token')).toBeNull();
    expect(secureStore.deleteItemAsync).not.toHaveBeenCalled();
  });

  it('removeToken() efface aussi les infos utilisateur sauvegardées, pas seulement le token', async () => {
    RNPlatform.OS = 'web';
    const { saveToken, saveUser, getSavedUser, removeToken } = await import('@/lib/auth');

    await saveToken('t');
    await saveUser({ id: '1', role: 'patient' });
    expect(await getSavedUser()).toEqual({ id: '1', role: 'patient' });

    await removeToken();
    expect(await getSavedUser()).toBeNull();
  });

  it('getToken()/getSavedUser() renvoient null quand rien n\'est stocké', async () => {
    RNPlatform.OS = 'web';
    const { getToken, getSavedUser } = await import('@/lib/auth');
    expect(await getToken()).toBeNull();
    expect(await getSavedUser()).toBeNull();
  });
});
