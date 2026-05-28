import { fetchClient } from "@/app/services/api";

export const marketFetcher = async ({ filters }: any) => {
  const params = new URLSearchParams({ ...filters, page: "1", per_page: "12" });
  const data = await fetchClient(`/store/products/?${params.toString()}`);

  return data || { products: [], total: 0 };
};

export const productFetcher = async (id: string) => {
  const data = await fetchClient(`/store/products/${id}`);
  return data?.data || {};
};

export const profileFetcher = async (userId: string) => {
  const data = await fetchClient(`/users/${userId}`);
  return data?.data || null;
};

export const allUsersFetcher = async () => {
  let page = 1;
  let allUsers: any[] = [];

  while (true) {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: "100",
    });
    const data = await fetchClient(`/users?${params.toString()}`);

    const result = data?.data;
    const users = result?.users || result?.items || [];
    allUsers = [...allUsers, ...users];

    const hasMore = result?.page * result?.page_size < result?.total;
    if (!hasMore || users.length === 0) break;
    page++;
  }

  return allUsers;
};
