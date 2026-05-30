"use client";

import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useChatUtils } from "../context/ChatContext";

const ChatResetBridge = () => {
  const { registerChatReset } = useAuth();
  const { resetChatState } = useChatUtils();

  useEffect(() => {
    if (typeof registerChatReset === "function") {
      registerChatReset(resetChatState);
    }
  }, [registerChatReset, resetChatState]);

  return null;
};

export default ChatResetBridge;
