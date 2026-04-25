import { MetadataRoute } from "next";
import { marketFetcher } from "./_utils/server_functions/fetchers";

// This ensures the sitemap is generated fresh
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://www.bouwnce.com";

  // 1. Static Routes
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
      url: `${baseUrl}/waitlist`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  try {
    // 2. Dynamic Products
    const response = await marketFetcher({ filters: { per_page: 50 } });
    const products = response?.products || response?.data || [];

    if (Array.isArray(products) && products.length > 0) {
      const dynamicRoutes = products.map((product: any) => ({
        url: `${baseUrl}/marketplace/product/${product.id}`,
        lastModified: product.updated_at
          ? new Date(product.updated_at)
          : new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));

      return [...staticRoutes, ...dynamicRoutes];
    }
  } catch (error) {
    console.error("Sitemap fetch error:", error);
  }

  // Fallback so the file at least exists
  return staticRoutes;
}
