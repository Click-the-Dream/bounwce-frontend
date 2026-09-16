import { generatePageMetadata } from "@/app/_utils/metadata";
import ChatComponent from "./_components/ChatComponent";

export const metadata = generatePageMetadata({
  title: "Chat",
  description: "Chat with other users and stay connected with your community.",
});
const ChatPage = () => {
  return <ChatComponent />;
};

export default ChatPage;
