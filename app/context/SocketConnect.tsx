import { useParams } from "next/navigation";
import { useAuth } from "./AuthContext";
import { useSocketConnection } from "../hooks/use-socket";
import { useEffect, useState } from "react";
import { websocket } from "../services/websocket";
import { ConnectionStatusToast } from "../_utils/ConnectionStatusToast";

export default function SocketConnect({
  children,
}: {
  children: React.ReactNode;
}) {
  const { authDetails } = useAuth();

  const params = useParams<{ chatId: string }>();

  useSocketConnection({
    authUserId: authDetails?.user?.id,
    activeConversationId: params?.chatId,
  });

  return (
    <>
      {children}
      <ConnectionStatusToast />
    </>
  );
}
