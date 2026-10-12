import { MetadataRoute } from "next";
import { marketFetcher, allStoresFetcher } from "./_utils/server_functions/fetchers"; // Add your store fetcher
import { createStorePath } from "./_utils/store-url";

export const revalidate = 3600; // Cache for 1 hour instead of 0 for better performance

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

    // 2. Fetch stores
    const storesRes = await allStoresFetcher(); // Ensure you fetch active stores
    const stores = storesRes?.stores || storesRes?.data || storesRes || [];

    const storeRoutes: MetadataRoute.Sitemap = Array.isArray(stores)
      ? stores
          .filter((store: any) => store.is_active !== false)
          .map((store: any) => {
            const storePath = createStorePath({
              user_id: store.user_id ?? store.id,
              name: store.name,
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
