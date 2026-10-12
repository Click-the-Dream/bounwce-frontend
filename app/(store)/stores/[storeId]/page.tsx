import { generatePageMetadata } from "@/app/_utils/metadata";
import { storeFetcher } from "@/app/_utils/server_functions/fetchers";
import StoreFront from "../_components/StoreFront";

interface StorePageProps {
  params: Promise<{ storeId: string }>;
}

export const generateMetadata = async ({ params }: StorePageProps) => {
  const { storeId } = await params;

  if (!storeId) {
    return generatePageMetadata({
      title: "Store Not Found",
      description: "The requested store could not be found on Bouwnce.",
      path: "/stores",
      noIndex: true,
    });
  }

  const store = await storeFetcher(storeId);

  if (!store) {
    return generatePageMetadata({
      title: "Store Not Found",
      description: "The requested store could not be found on Bouwnce.",
      path: `/stores/${encodeURIComponent(storeId)}`,
      noIndex: true,
    });
  }

  const storeName = String(store.name || "Bouwnce Store").trim();
  const storeDescription = String(store.store_description || "").trim();
  const address = String(store.address || "").trim();
  const description = [storeDescription, address]
    .filter(Boolean)
    .join(" · ")
    .slice(0, 300) || `Explore products and offers from ${storeName} on Bouwnce.`;
  const imageUrl = store.store_banner?.url || store.store_logo?.url;

  return generatePageMetadata({
    title: storeName,
    description,
    imageUrl,
    path: `/stores/${encodeURIComponent(storeId)}`,
    keywords: [
      storeName,
      address,
      "Bouwnce store",
      "online store",
      "marketplace",
    ].filter(Boolean),
    noIndex: store.is_active === false,
    openGraph: {
      title: `${storeName} | Bouwnce Store`,
      description,
      type: "website",
    },
    twitter: {
      title: `${storeName} | Bouwnce Store`,
      description,
      card: "summary_large_image",
    },
  });
};

const StorePage = () => <StoreFront />;

export default StorePage;
