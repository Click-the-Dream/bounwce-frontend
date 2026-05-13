import axios from "axios";

const api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api/v1`,
  timeout: 60000,
  withCredentials: true, // REQUIRED for refresh cookies
});

export default api;
