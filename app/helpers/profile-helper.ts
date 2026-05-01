import { useParams } from "next/navigation";
import { useAuth } from "../context/AuthContext";

export const profileHelper = () => {
  const { authDetails } = useAuth();
  const params = useParams<{ userId?: string }>();

  const viewerId = authDetails?.user?.id;

  // IMPORTANT: explicit routing rule
  const profileId = params?.userId ?? viewerId;

  const isOwnProfile = viewerId === profileId;

  return {
    viewerId,
    profileId,
    isOwnProfile,
  };
};
