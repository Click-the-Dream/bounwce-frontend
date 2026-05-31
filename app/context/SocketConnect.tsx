import { useParams } from "next/navigation";
import { useAuth } from "./AuthContext";
import { useSocketConnection } from "../hooks/use-socket";
import { ConnectionStatusToast } from "../_utils/ConnectionStatusToast";
import AuthModal from "../_components/AuthModal";
import { useEffect } from "react";
import useLocation from "../hooks/use-location";
import ConnectionModal from "../(dashboard)/app/explore/_components/ConnectionModal";

export default function SocketConnect({
  children,
}: {
  children: React.ReactNode;
}) {
  const { authDetails, showAuthModal, setShowAuthModal } = useAuth();
  const { syncLocation } = useLocation();

  useEffect(() => {
    if (authDetails?.user) syncLocation();
  }, [authDetails?.user]);

  const params = useParams<{ chatId: string }>();

  useSocketConnection({
    authUserId: authDetails?.user?.id,
    activeConversationId: params?.chatId,
  });

  return (
    <>
      {children}
      <ConnectionStatusToast />
      <AuthModal
        isOpen={showAuthModal || false}
        onClose={() => setShowAuthModal(false)}
      />
      <ConnectionModal />
    </>
  );
}
