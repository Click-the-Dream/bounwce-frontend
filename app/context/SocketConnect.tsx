import { useParams } from "next/navigation";
import { useAuth } from "./AuthContext";
import { useSocketConnection } from "../hooks/use-socket";
import { ConnectionStatusToast } from "../_utils/ConnectionStatusToast";
import AuthModal from "../_components/AuthModal";

export default function SocketConnect({
  children,
}: {
  children: React.ReactNode;
}) {
  const { authDetails, showAuthModal, setShowAuthModal } = useAuth();

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
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
}
