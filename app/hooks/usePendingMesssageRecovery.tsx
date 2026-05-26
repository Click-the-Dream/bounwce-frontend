import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { websocket } from "../services/websocket";
import { getChatDB } from "../store/chat-store";
import useChat from "./use-chat";

export const usePendingMessageRecovery = (userId: string | undefined) => {
  const queryClient = useQueryClient();
  const chatDB = getChatDB(userId || "");
  const { uploadAndEmitMedia, useGetChatSignature } = useChat();

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

    try {
      const allMessages = await chatDB.messages.toArray();

      // Filter to stuck messages: uploading, sending, or failed (with retry count < 3)
      const stuckMessages = allMessages.filter((m: any) => {
        const status = m.delivery_status;
        const isStuck =
          status === "uploading" || status === "sending" || status === "failed";

        if (!isStuck) return false;

        // Don't retry same message more than 3 times
        const retryCount = retryCountRef.current[m.id] || 0;
        return retryCount < 3;
      });

      console.log(
        `[MessageRecovery] Found ${stuckMessages.length} stuck messages`,
      );

      for (const msg of stuckMessages) {
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
    const status = msg.delivery_status;
    const messageId = msg.id;

    // Track retry attempts
    retryCountRef.current[messageId] =
      (retryCountRef.current[messageId] || 0) + 1;

    console.log(
      `[MessageRecovery] Recovering ${msg.media_type} message (${status}) — attempt ${retryCountRef.current[messageId]}`,
    );

    // Media message (image/video/file) stuck while uploading or sending
    if (msg.media_type && msg.media_urls && msg.media_urls.length > 0) {
      // Has real URLs, just needs to resend via socket
      if (!msg.media_urls[0].startsWith("blob:")) {
        // Uploaded to cloud — resend the socket event
        websocket.emit("chat.upload_media", {
          recipient_id: msg.conversation_id, // or use the other user ID
          media_urls: msg.media_urls,
          body: msg.body || msg.caption || "",
          client_id: msg.client_id || msg.id,
          media_type: msg.media_type,
          reply_to_message_id: msg.reply_to_message_id,
        });

        // Update status in cache to "sending"
        updateMessageStatus(msg.conversation_id, messageId, "sending");
      }
      // else: has blob URLs — would need original files to re-upload, skip for now
      return;
    }

    // Text message stuck in "sending" state — resend
    if (msg.body && status === "sending") {
      websocket.emit("chat.send", {
        recipient_id: msg.conversation_id,
        body: msg.body,
        reply_to_message_id: msg.reply_to_message_id,
      });

      updateMessageStatus(msg.conversation_id, messageId, "sending");
      return;
    }

    // Message in "failed" state — mark for manual retry (don't auto-retry)
    // User can see the retry button and decide
  };

  /**
   * Update message status in React Query cache and IndexedDB
   */
  const updateMessageStatus = (
    conversationId: string,
    messageId: string,
    newStatus: string,
  ) => {
    // Update React Query cache
    queryClient.setQueryData(["messages", conversationId], (old: any) => {
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

    // Update IndexedDB
    chatDB.messages.update(messageId, {
      delivery_status: newStatus,
    });
  };

  // Optional: expose manual recovery trigger for UI
  return {
    recoverPendingMessages,
    retryCountRef,
  };
};
