import axios from "axios";

const api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api/v1`,
  timeout: 60000,
  withCredentials: true, // REQUIRED for refresh cookies
});
const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export const fetchClient = async (
  endpoint: string,
  options: RequestInit = {},
) => {
  const url = `${BASE_URL}/api/v1${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) return null;
  return response.json();
};
export default api;
