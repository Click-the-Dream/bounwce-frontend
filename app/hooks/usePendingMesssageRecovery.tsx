import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { websocket } from "../services/websocket";
import { useChatUtils } from "../context/ChatContext";

export const usePendingMessageRecovery = (userId: string | undefined) => {
  const queryClient = useQueryClient();
  const { chatDBRef } = useChatUtils();
  const recoveryInProgressRef = useRef(false);
  const retryCountRef = useRef<Record<string, number>>({});

  useEffect(() => {
    if (!userId) return;

    const handleReconnect = async (state: string) => {
      // Only recover when socket successfully reconnects
      if (state !== "connected") return;

      if (recoveryInProgressRef.current) return;
      recoveryInProgressRef.current = true;

      try {
        await recoverPendingMessages();
      } catch (err) {
        console.error("Message recovery failed:", err);
      } finally {
        recoveryInProgressRef.current = false;
      }
    };

    websocket.onStateChange(handleReconnect);

    return () => {
      websocket.offStateChange(handleReconnect);
    };
  }, [userId]);

  /**
   * Scans IndexedDB for messages in stuck states and recovers them
   */
  const recoverPendingMessages = async () => {
    if (!userId) return;
    const chatDB = chatDBRef.current;

    try {
      const allMessages = await chatDB.messages
        .orderBy("created_at") // ← sort by time, preserves send order
        .filter((m: any) => {
          const status = m.delivery_status;
          const isStuck =
            status === "pending" ||
            status === "uploading" ||
            status === "sending" ||
            status === "failed";
          if (!isStuck) return false;
          const retryCount = retryCountRef.current[m.id] || 0;
          return retryCount < 3;
        })
        .toArray();

      for (const msg of allMessages) {
        try {
          await recoverMessage(msg);
        } catch (err) {
          console.warn(`Failed to recover message ${msg.id}:`, err);
        }
      }
    } catch (err) {
      console.error("Error scanning for stuck messages:", err);
    }
  };

  /**
   * Recover a single stuck message based on its type and state
   */
  const recoverMessage = async (msg: any) => {
    const messageId = msg.id;
    const recipientId = msg.peer_id;
    const chatDB = chatDBRef.current;

    retryCountRef.current[messageId] =
      (retryCountRef.current[messageId] || 0) + 1;

    // Media message
    if (msg.media_type) {
      const hasBlobUrls = msg.media_urls?.[0]?.startsWith("blob:");
      const hasNoUrls = !msg.media_urls?.length;

      if (hasBlobUrls || hasNoUrls) {
        // Upload never completed — original File objects are gone.
        // Mark failed so user sees the retry button.
        updateMessageStatus(recipientId, messageId, "failed");
        await chatDB.messages.update(messageId, { delivery_status: "failed" });
        return;
      }

      // Has real cloud URLs — upload finished, just resend socket event
      websocket.emit("chat.upload_media", {
        recipient_id: recipientId,
        media_urls: msg.media_urls,
        body: msg.body || msg.caption || "",
        client_id: msg.client_id || msg.id,
        media_type: msg.media_type,
        reply_to_message_id: msg.reply_to_message_id,
      });

      updateMessageStatus(recipientId, messageId, "sending");
      return;
    }

    // Text message
    if (msg.body) {
      websocket.emit("chat.send", {
        recipient_id: recipientId,
        body: msg.body,
        reply_to_message_id: msg.reply_to_message_id,
      });

      updateMessageStatus(recipientId, messageId, "sending");
    }
  };

  /**
   * Update message status in React Query cache and IndexedDB
   */
  const updateMessageStatus = (
    peerId: string, // rename for clarity
    messageId: string,
    newStatus: string,
  ) => {
    const chatDB = chatDBRef.current;
    queryClient.setQueryData(["messages", peerId], (old: any) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((page: any) => ({
          ...page,
          messages: {
            ...page.messages,
            items: page.messages.items.map((m: any) =>
              m.id === messageId ? { ...m, delivery_status: newStatus } : m,
            ),
          },
        })),
      };
    });

    chatDB.messages.update(messageId, { delivery_status: newStatus });
  };

  // Optional: expose manual recovery trigger for UI
  return {
    recoverPendingMessages,
    retryCountRef,
  };
};
