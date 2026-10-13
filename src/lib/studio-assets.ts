import { t } from "./i18n";
import { config } from "./book";
/** IndexedDB persistence for images used by the browser-only authoring studio. */
const DATABASE = config.persistence.assetsDatabase;
const STORE = "images";

function connection(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window))
      return reject(new Error(t(config.defaultLocale).assetStorageUnavailable));
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE))
        database.createObjectStore(STORE);
    };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function transaction<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await connection();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const req = run(tx.objectStore(STORE));
      let value: T;
      req.onsuccess = () => {
        value = req.result;
      };
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => resolve(value);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () =>
        reject(
          tx.error ??
            new Error(t(config.defaultLocale).assetTransactionAborted),
        );
    });
  } finally {
    db.close();
  }
}

export async function loadStoredImages(): Promise<File[]> {
  return transaction("readonly", (store) => store.getAll());
}
export async function saveStoredImage(file: File): Promise<void> {
  await transaction("readwrite", (store) => store.put(file, file.name));
}
export async function deleteStoredImage(name: string): Promise<void> {
  await transaction("readwrite", (store) => store.delete(name));
}

export function assetFilename(filename: string): string {
  // Never allow directory traversal, executable extensions or filesystem separators.
  const match = /\.(png|jpe?g|webp|gif|avif)$/i.exec(filename);
  if (!match) throw new Error(t(config.defaultLocale).unsupportedImage);
  const stem =
    filename
      .slice(0, -match[0].length)
      .normalize("NFKC")
      .replace(/[^a-zA-Z0-9_-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "image";
  return `${stem.toLowerCase()}.${match[1].toLowerCase()}`;
}
