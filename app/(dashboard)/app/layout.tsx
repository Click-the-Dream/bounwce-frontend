import { generatePageMetadata } from "@/app/_utils/metadata";
import BuyerLayout from "./_components/BuyerLayout";
import SecureRoute from "@/app/protocols/SecureRoutes";
import { NotificationProvider } from "@/app/context/NotificationContext";
import { ChatProvider } from "@/app/context/ChatContext";

export const metadata = generatePageMetadata({
  title: "Buyer Dashboard | Bouwnce",
  description:
    "Explore events, connect with people, track your activity, and manage your profile from your Bouwnce buyer dashboard.",
});

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SecureRoute>
      <BuyerLayout children={children} />
    </SecureRoute>
  );
};

export default layout;
