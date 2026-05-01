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

export const productFetcher = async (id: string) => {
  const { data } = await api.get(`/store/products/${id}`);
  return data?.data || {};
};

export const profileFetcher = async (userId: string) => {
  const { data } = await api.get(`/users/${userId}`);
  return data?.data || {};
};
