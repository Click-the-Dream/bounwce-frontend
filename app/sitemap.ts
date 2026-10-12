import { MetadataRoute } from "next";
import { marketFetcher, allStoresFetcher } from "./_utils/server_functions/fetchers";
import { createStorePath } from "@/app/_utils/store-url";

export const revalidate = 3600; // Cache for 1 hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://www.bouwnce.com";

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/marketplace`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/stores`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/waitlist`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  try {
    // 1. Fetch products
    const productRes = await marketFetcher({ filters: { per_page: 100 } });
    const products = productRes?.products || productRes?.data || [];

    const productRoutes: MetadataRoute.Sitemap = Array.isArray(products)
      ? products.map((product: any) => ({
          url: `${baseUrl}/marketplace/product/${product.id}`,
          lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
          changeFrequency: "weekly" as const,
          priority: 0.7,
        }))
      : [];

    // 2. Fetch all stores using your endpoint format
    const stores = await allStoresFetcher();

    const storeRoutes: MetadataRoute.Sitemap = Array.isArray(stores)
      ? stores
          .filter((store: any) => store.is_active !== false)
          .map((store: any) => {
            const storeName = String(store.name || "store").trim();
            const storePath = createStorePath({
              user_id: store.user_id ?? store.id,
              name: storeName,
            });

            return {
              url: `${baseUrl}${storePath}`,
              lastModified: store.updated_at ? new Date(store.updated_at) : new Date(),
              changeFrequency: "daily" as const,
              priority: 0.8,
            };
          })
      : [];

    return [...staticRoutes, ...productRoutes, ...storeRoutes];
  } catch (error) {
    console.error("Sitemap fetch error:", error);
    return staticRoutes;
  }
}
