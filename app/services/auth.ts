import axios from "axios";

let refreshPromise: Promise<any> | null = null;

export const refreshTokenCall = (): Promise<any> => {
  if (refreshPromise) return refreshPromise;

  refreshPromise = axios
    .post(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/refresh-token`,
      {},
      { withCredentials: true },
    )
    .then((res) => res.data)
    .finally(() => {
      refreshPromise = null;
    });
  // ← no .catch() here — let handleRefresh decide what to do with the error

  return refreshPromise;
};
