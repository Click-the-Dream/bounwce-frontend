import { MetadataRoute } from "next";
import { marketFetcher } from "./_utils/server_functions/fetchers";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://bouwnce.com";

  const productData = await marketFetcher({ filters: { per_page: 100 } });

  const products = productData?.data || [];

  const productEntries: MetadataRoute.Sitemap = products.map(
    (product: any) => ({
      url: `${baseUrl}/marketplace/product/${product.id}`,
      lastModified: product.updated_at
        ? new Date(product.updated_at)
        : new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    }),
  );

  //  Static Routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
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
      changeFrequency: "monthly",
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

  return [...staticRoutes, ...productEntries];
}
