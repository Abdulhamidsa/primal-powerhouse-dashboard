import * as SecureStore from 'expo-secure-store';

export const sessionStorage = {
  read: (key: string) => SecureStore.getItemAsync(key),
  write: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  remove: (key: string) => SecureStore.deleteItemAsync(key),
};
