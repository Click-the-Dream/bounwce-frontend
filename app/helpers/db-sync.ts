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
    console.warn("updateDBEntity: DB is null");
    return null;
  }

  if (!db.isOpen()) {
    try {
      await db.open();
    } catch (err) {
      console.error("DB open failed", err);
      return null;
    }
  }

  const table = db[store];
  const existing = await table.where(key).equals(keyValue).first();

  const updated = updater(existing ?? null);
  if (!updated) return null;

  await table.put(updated);
  return updated;
};

export const syncQueryEntity = ({
  queryClient,
  queryKey,
  selector,
  updater,
}: any) => {
  queryClient.setQueriesData({ queryKey }, (old: any) => {
    if (!old?.pages) return old;
    if (typeof selector !== "function") return old;

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
  syncQueryEntity({ queryClient, queryKey, selector, updater });

  if (!db) return;

  updateDBEntity({
    db,
    store,
    key,
    keyValue,
    updater,
  }).catch((err) => {
    console.error(`Failed DB sync for ${store}`, err);
  });
};
