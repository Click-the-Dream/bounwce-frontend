import { generatePageMetadata } from "@/app/_utils/metadata";
import StoreDirectory from "./_components/StoreDirectory";

export const metadata = generatePageMetadata({
  title: "Explore Stores",
  description:
    "Discover independent stores on Bouwnce, explore their products, and find sellers from across the community.",
  path: "/stores",
  keywords: ["stores", "online stores", "shop", "marketplace", "vendors"],
});

const StoresPage = () => <StoreDirectory />;

export default StoresPage;
