import { generatePageMetadata } from "@/app/_utils/metadata";
import Newsletter from "./_components/Newsletter";

export const metadata = generatePageMetadata({
  title: "Newsletter Dashboard | Manage Campaigns & Subscribers",
  description:
    "Create, manage, and track newsletter campaigns. View subscriber analytics, send updates, and monitor engagement in your newsletter dashboard.",
});

const page = () => {
  return <Newsletter />;
};

export default page;
