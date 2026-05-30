import api from "./api";

export const setupInterceptors = (getAuth: any, refreshFn: any) => {
  api.interceptors.request.use((config) => {
    const auth = getAuth();
    if (auth?.access_token) {
      config.headers.Authorization = `Bearer ${auth.access_token}`;
    }
    return config;
  });

  api.interceptors.response.use(
    (res) => res,
    async (error) => {
      const original = error.config;

      // Don't retry on network errors — no point, request won't reach server
      if (!error.response) {
        return Promise.reject(error);
      }

      if (error.response?.status === 401 && !original._retry) {
        original._retry = true;

        const newToken = await refreshFn();

        if (newToken) {
          original.headers.Authorization = `Bearer ${newToken}`;
          return api(original);
        }

        // refreshFn returned null — either network issue or logged out
        // Just reject, don't retry again
        return Promise.reject(error);
      }

      return Promise.reject(error);
    },
  );
};
