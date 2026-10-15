import { generatePageMetadata } from "@/app/_utils/metadata";
import FindUsers from "./_components/FindUsers";

export const metadata = generatePageMetadata({
  title: "Explore",
  description: "Discover and connect with new people",
});

const page = () => {
  return <FindUsers />;
};

export default page;
