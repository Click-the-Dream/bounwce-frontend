import axios from "axios";

let refreshPromise: Promise<any> | null = null;
export const refreshTokenCall = async (): Promise<string> => {
  const res = await axios.post(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/refresh-token`,
    {},
    { withCredentials: true },
  );

  return res.data?.data?.access_token;
};
