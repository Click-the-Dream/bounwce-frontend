"use client";

const DB_NAME = "bouwnce-feed-media";
const STORE_NAME = "images";
const DB_VERSION = 1;

export const IDB_MEDIA_PREFIX = "idb:";

type StoredMediaRecord = {
  id: string;
  blob: Blob;
  createdAt: number;
};

const createMediaId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const openMediaDb = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB is not supported."));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error ?? new Error("Failed to open IndexedDB."));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, {
          keyPath: "id",
        });
      }
    };
  });
};

const putMediaBlob = async (blob: Blob): Promise<string> => {
  const db = await openMediaDb();

  const id = createMediaId();

  const record: StoredMediaRecord = {
    id,
    blob,
    createdAt: Date.now(),
  };

  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");

    const store = transaction.objectStore(STORE_NAME);

    store.put(record);

    transaction.oncomplete = () => {
      resolve();
    };

    transaction.onerror = () => {
      reject(transaction.error ?? new Error("Failed to store media."));
    };
  });

  db.close();

  return `${IDB_MEDIA_PREFIX}${id}`;
};

export const isIndexedDbMediaRef = (value: string) => {
  return value.startsWith(IDB_MEDIA_PREFIX);
};

export const isLocalMedia = (value: string) => {
  return value.startsWith("data:") || value.startsWith("blob:");
};

const dataUrlToBlob = (dataUrl: string): Blob => {
  const [header, data] = dataUrl.split(",");

  if (!header || !data) {
    throw new Error("Invalid data URL.");
  }

  const mimeMatch = header.match(/data:(.*?)(;base64)?$/);

  const mimeType = mimeMatch?.[1] ?? "application/octet-stream";

  const isBase64 = header.includes(";base64");

  if (isBase64) {
    const binary = atob(data);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    return new Blob([bytes], {
      type: mimeType,
    });
  }

  return new Blob([decodeURIComponent(data)], {
    type: mimeType,
  });
};

const localMediaToBlob = async (src: string): Promise<Blob> => {
  if (src.startsWith("data:")) {
    return dataUrlToBlob(src);
  }

  if (src.startsWith("blob:")) {
    const response = await fetch(src);

    if (!response.ok) {
      throw new Error(`Failed to read local media: ${response.status}`);
    }

    return response.blob();
  }

  throw new Error("The supplied media is not local media.");
};

export const storeLocalMedia = async (src: string): Promise<string> => {
  const blob = await localMediaToBlob(src);

  return putMediaBlob(blob);
};

export const getMediaBlob = async (mediaRef: string): Promise<Blob | null> => {
  if (!isIndexedDbMediaRef(mediaRef)) {
    return null;
  }

  const id = mediaRef.slice(IDB_MEDIA_PREFIX.length);

  const db = await openMediaDb();

  const record = await new Promise<StoredMediaRecord | undefined>(
    (resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");

      const store = transaction.objectStore(STORE_NAME);

      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result as StoredMediaRecord | undefined);
      };

      request.onerror = () => {
        reject(request.error ?? new Error("Failed to read media."));
      };
    },
  );

  db.close();

  return record?.blob ?? null;
};
