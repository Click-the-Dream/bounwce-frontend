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
  let existing = await table.where(key).equals(keyValue).first();

  if (!existing && key === "id") {
    existing = await table.where("client_id").equals(keyValue).first();
  }
  const base = existing ?? { [key]: keyValue };

  const updated = updater(base);
  if (!updated?.[key]) {
    console.error("Missing key path for IndexedDB put()", {
      key,
      updated,
    });
    return null;
  }

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
  // store,
  // key,
  // keyValue,
  queryKey,
  updater,
  selector,
}: any) => {
  syncQueryEntity({ queryClient, queryKey, selector, updater });

  // if (!db) return;

  // updateDBEntity({
  //   db,
  //   store,
  //   key,
  //   keyValue,
  //   updater,
  // }).catch((err) => {
  //   console.error(`Failed DB sync for ${store}`, err);
  // });
};

const markMessageAsReadSelector = (old: any, updater: any) => {
  return {
    ...old,
    pages: old.pages.map((page: any) => ({
      ...page,
      messages: {
        ...page.messages,
        items: page.messages.items.map((msg: any) => updater(msg)),
      },
    })),
  };
};
const markAsReadUpdater = (msgId: string, userId: string) => (msg: any) => {
  if (msg.id !== msgId) return msg;

  if (msg.sender_id === userId) return msg;

  return {
    ...msg,
    read_at: msg.read_at ?? new Date().toISOString(),
  };
};

export const syncMessageRead = async ({
  db,
  queryClient,
  chatId,
  messageId,
  userId,
}: any) => {
  const updater = markAsReadUpdater(messageId, userId);

  await syncEntity({
    db,
    queryClient,
    store: "messages",
    key: "peer_id",
    keyValue: chatId,
    queryKey: ["messages", chatId],
    updater,
    selector: markMessageAsReadSelector,
  });
};
