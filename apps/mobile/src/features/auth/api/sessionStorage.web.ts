function storageOperation<T>(operation: (storage: Storage) => T): T {
  try {
    return operation(window.sessionStorage);
  } catch {
    throw new Error('Browser session storage is unavailable. Allow site storage for this app, then sign in again.');
  }
}

export const sessionStorage = {
  async read(key: string) {
    if (typeof window === 'undefined') return null;
    return storageOperation(storage => storage.getItem(key));
  },
  async write(key: string, value: string) {
    storageOperation(storage => storage.setItem(key, value));
  },
  async remove(key: string) {
    storageOperation(storage => storage.removeItem(key));
  },
};
