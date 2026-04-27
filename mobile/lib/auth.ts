import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'gs_token';
const USER_KEY = 'gs_user';

// SecureStore is not available on web — use localStorage as fallback
async function setItem(key: string, value: string) {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function deleteItem(key: string) {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}

export async function saveToken(token: string) {
  await setItem(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  return getItem(TOKEN_KEY);
}

export async function removeToken() {
  await deleteItem(TOKEN_KEY);
  await deleteItem(USER_KEY);
}

export async function saveUser(user: object) {
  await setItem(USER_KEY, JSON.stringify(user));
}

export async function getSavedUser(): Promise<object | null> {
  const raw = await getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}
