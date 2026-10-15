import { generatePageMetadata } from "@/app/_utils/metadata";
import ManageRequests from "./_components/ManageRequests";
export const metadata = generatePageMetadata({
  title: "Connection Requests",
  description: "Manage your connection requests",
});

const page = () => {
  return <ManageRequests />;
};

export default page;
