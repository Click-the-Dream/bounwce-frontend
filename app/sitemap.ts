import { MetadataRoute } from "next";
import { marketFetcher } from "./_utils/server_functions/fetchers";

export const revalidate = 0;

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
      url: `${baseUrl}/waitlist`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  try {
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

      /* This part of the code is fetching all users using the `allUsersFetcher` function and then
     mapping over each user to create profile routes for the sitemap. */
      // const users = await allUsersFetcher();
      // const profileRoutes: MetadataRoute.Sitemap = users.map((user: any) => ({
      //   url: `${baseUrl}/app/profile/${slugify(user.full_name)}_${user.id}`,
      //   lastModified: user.updated_at ? new Date(user.updated_at) : new Date(),
      //   changeFrequency: "weekly" as const,
      //   priority: 0.6,
      // }));

      return [...staticRoutes, ...dynamicRoutes];
    }
  } catch (error) {
    console.error("Sitemap fetch error:", error);
  }

  return staticRoutes;
}
