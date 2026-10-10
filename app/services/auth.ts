import axios from "axios";

export const refreshTokenCall = async (): Promise<string> => {
  const res = await axios.post(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/refresh-token`,
    {},
    {
      withCredentials: true,
      // Avoid leaving protected requests waiting indefinitely if the network
      // drops while the refresh endpoint is in flight.
      timeout: 15_000,
    },
  );

  return res.data?.data?.access_token;
};
