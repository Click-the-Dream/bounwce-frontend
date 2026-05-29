// helpers/db-sync.ts

export const updateDBEntity = async ({
  db,
  store,
  key,
  keyValue,
  updater,
}: {
  db: any;
  store: string;
  key: string;
  keyValue: string;
  updater: (item: any) => any;
}) => {
  if (!db) {
    await db;
  }
  const table = db[store];

  const existing = await table.where(key).equals(keyValue).first();
  if (!existing) return null;

  const updated = updater(existing);
  await table.put(updated);

  return updated;
};

// React Query sync (single item)
export const syncQueryEntity = async ({
  queryClient,
  queryKey,
  updater,
  selector,
}: {
  queryClient: any;
  queryKey: string[];
  selector: (old: any, updater: (item: any) => any) => any;
  updater: (item: any) => any;
}) => {
  queryClient.setQueriesData({ queryKey }, (old: any) => {
    if (!old?.pages) return old;
    if (typeof selector !== "function") {
      console.error("syncQueryEntity: selector is not a function");
      return old;
    }

    return selector(old, updater);
  });
};

export const syncEntity = async ({
  db,
  queryClient,
  store,
  key,
  keyValue,
  queryKey,
  updater,
  selector,
}: any) => {
  // instant cache update
  syncQueryEntity({
    queryClient,
    queryKey,
    updater,
    selector,
  });

  // async db sync
  updateDBEntity({
    db,
    store,
    key,
    keyValue,
    updater,
  }).catch((err) => console.error(`Failed to sync ${store}:`, err));
};
