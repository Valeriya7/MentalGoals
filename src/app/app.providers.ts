import { Storage } from '@ionic/storage-angular';

export const appProviders = [
  {
    provide: Storage,
    useFactory: async () => {
      const storage = new Storage();
      await storage.create();
      return storage;
    }
  }
]; 