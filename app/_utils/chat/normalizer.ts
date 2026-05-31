export const normalizeMessage = (msg: any, peerId: string) => {
  return {
    ...msg,
    id: msg.id ?? msg.client_id,
    client_id: msg.client_id ?? msg.id,
    peer_id: msg.peer_id ?? peerId,
    delivery_status: msg.delivery_status ?? "sent",
    synced: msg.synced ?? true,
  };
};

export const normalizeInfinite = (data: any) =>
  data?.pages?.[0]?.messages?.items ? data : undefined;
