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
export const syncQueryEntity = ({
  queryClient,
  queryKey,
  predicate,
  updater,
}: {
  queryClient: any;
  queryKey: string[];
  predicate: (item: any) => boolean;
  updater: (item: any) => any;
}) => {
  queryClient.setQueriesData({ queryKey }, (old: any) => {
    if (!old?.pages) return old;

    return {
      ...old,
      pages: old.pages.map((page: any) => ({
        ...page,
        items: page.items.map((item: any) =>
          predicate(item) ? updater(item) : item,
        ),
      })),
    };
  });
};

export const syncDBEntity = ({ db, store, key, keyValue, updater }: any) => {
  return updateDBEntity({
    db,
    store,
    key,
    keyValue,
    updater,
  });
};

export const syncEntity = ({
  db,
  queryClient,
  store,
  key,
  keyValue,
  queryKey,
  predicate,
  updater,
}: any) => {
  //  INSTANT UI UPDATE (NO AWAIT)
  syncQueryEntity({
    queryClient,
    queryKey,
    predicate,
    updater,
  });

  // BACKGROUND DB WRITE (NO BLOCKING)
  syncDBEntity({
    db,
    store,
    key,
    keyValue,
    updater,
  });
};
