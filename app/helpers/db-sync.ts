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

const markMessageAsReadSelector = (old: any, updater: any) => ({
  ...old,
  pages: old.pages.map((page: any) => ({
    ...page,
    messages: {
      ...page.messages,
      items: (page.messages?.items ?? []).map((msg: any) => updater(msg)),
    },
  })),
});

const markAsReadUpdater = (msgId: string, userId: string) => (msg: any) => {
  if (msg.id !== msgId) return msg;
  if (msg.sender_id === userId) return msg;
  return { ...msg, read_at: msg.read_at ?? new Date().toISOString() };
};

export const syncMessageRead = async ({
  queryClient,
  chatId,
  messageId,
  userId,
}: any) => {
  syncQueryEntity({
    queryClient,
    queryKey: ["messages", chatId],
    updater: markAsReadUpdater(messageId, userId),
    selector: markMessageAsReadSelector,
  });
};
