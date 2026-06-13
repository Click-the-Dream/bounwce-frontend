import { useMutation } from "@tanstack/react-query";
import api from "../services/api";

async function upsertLocation(coords: { lat: number; lon: number }) {
  const { data } = await api.put("/location/me", coords);
  return data;
}

export default function useLocation() {
  const mutation = useMutation({ mutationFn: upsertLocation });

  const syncLocation = () => {
    if (!navigator.geolocation) return; // browser doesn't support it

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        mutation.mutate({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        });
      },
      (err) => {
        console.warn("Location permission denied or unavailable:", err.message);
      },
      { enableHighAccuracy: false, timeout: 8000 },
    );
  };

  return { syncLocation, ...mutation };
}
