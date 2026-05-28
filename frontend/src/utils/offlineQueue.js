import { openDB } from 'idb';

const DB_NAME = 'preoperacional_offline';
const STORE = 'pending_inspections';

async function getDb() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
    },
  });
}

export async function enqueueInspection(formData) {
  // FormData no se puede serializar directamente a IndexedDB
  // Extraemos los campos y guardamos los blobs por separado
  const entry = {
    timestamp: Date.now(),
    fields: {},
    photos: {}, // { configId: { blob: Blob, name: string, type: string } }
  };

  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      // key es algo como "photo_123"
      entry.photos[key] = { blob: value, name: value.name, type: value.type };
    } else {
      entry.fields[key] = value;
    }
  }

  const db = await getDb();
  return db.add(STORE, entry);
}

export async function getPendingInspections() {
  const db = await getDb();
  return db.getAll(STORE);
}

export async function removeInspection(id) {
  const db = await getDb();
  return db.delete(STORE, id);
}

export async function hasPendingInspections() {
  const db = await getDb();
  return (await db.count(STORE)) > 0;
}

export async function rebuildFormData(entry) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(entry.fields)) {
    fd.append(key, value);
  }
  for (const [key, photoData] of Object.entries(entry.photos)) {
    const file = new File([photoData.blob], photoData.name, { type: photoData.type });
    fd.append(key, file);
  }
  return fd;
}
