import { NotificationProvider } from "@/app/context/NotificationContext";
import ChatComponent from "../../buyer/chat/_components/ChatComponent";

const VendorChatPage = () => {
  return (
    <NotificationProvider>
      <ChatComponent role="vendor"/>
    </NotificationProvider>    
  );
};

export default VendorChatPage;
