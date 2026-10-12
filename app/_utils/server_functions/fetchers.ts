import api from "@/app/services/api";

export const marketFetcher = async ({ filters }: any) => {
  try {
    const { data } = await api.get("/store/products/", {
      params: {
        ...filters,
        page: 1,
        per_page: 12,
      },
      timeout: 10000, // prevent hanging
    });

    return data || { products: [], total: 0 };
  } catch (error: any) {
    return {
      data: [],
      total: 0,
      error: true,
    };
  }
};

/**
 * Fetches a public store for server-rendered pages such as generateMetadata.
 * Public store URLs currently use the vendor user ID (see the stores directory
 * navigation and useGetStoreInfo), so `userId` is intentionally used here.
 */
export const storeFetcher = async (userId: string) => {
  if (!userId) return null;

  try {
    const { data } = await api.get(`/store/${encodeURIComponent(userId)}`, {
      timeout: 10000,
    });
    const storeData = data?.data;

    // The current public endpoint returns data as an array; tolerate a single
    // object as well so metadata does not break if the API response is normalized.
    return Array.isArray(storeData) ? storeData[0] ?? null : storeData ?? null;
  } catch (error) {
    console.error("Failed to fetch store:", error);
    return null;
  }
};

export const productFetcher = async (id: string) => {
  const { data } = await api.get(`/store/products/${id}`);
  return data?.data || {};
};

export const profileFetcher = async (userId: string) => {
  try {
    const { data } = await api.get(`/users/${userId}`);
    return data?.data || null;
  } catch (err) {
    return null; // prevent build crash
  }
};

export const eventFetcher = async (eventId: string) => {
  try {
    const { data } = await api.get(`/outgoing/events/events/${eventId}`);
    return data?.data || null;
  } catch (err) {
    return null; // prevent build crash
  }
};

export const allUsersFetcher = async () => {
  try {
    let page = 1;
    let allUsers: any[] = [];

    while (true) {
      const { data } = await api.get("/users", {
        params: { page, page_size: 100 },
        timeout: 10000,
      });

      const result = data?.data;
      const users = result?.users || result?.items || [];
      allUsers = [...allUsers, ...users];

      const hasMore = result?.page * result?.page_size < result?.total;
      if (!hasMore || users.length === 0) break;

      page++;
    }

    return allUsers;
  } catch (error) {
    return [];
  }
};
