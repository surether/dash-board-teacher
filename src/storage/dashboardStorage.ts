export interface DashboardStorageAdapter {
  getItem<T>(key: string): Promise<T | null>;
  setItem<T>(key: string, value: T): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export const localStorageDashboardAdapter: DashboardStorageAdapter = {
  async getItem<T>(key: string) {
    if (typeof window === "undefined") {
      return null;
    }

    const rawValue = window.localStorage.getItem(key);
    if (!rawValue) {
      return null;
    }

    try {
      return JSON.parse(rawValue) as T;
    } catch {
      return null;
    }
  },

  async setItem<T>(key: string, value: T) {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(key, JSON.stringify(value));
  },

  async removeItem(key: string) {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.removeItem(key);
  },
};
