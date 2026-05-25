"use client";

import { Conversation } from "@/app/_utils/types/admin";
import ChatThread from "./ChatThread";

export default function ChatWindow({ convo }: { convo: Conversation }) {
  return <ChatThread convo={convo} />;
}
