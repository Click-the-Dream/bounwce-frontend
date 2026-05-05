import { useParams } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { getIDFromSlug } from "../_utils/slugify";

export const profileHelper = () => {
  const { authDetails } = useAuth();
  const params = useParams<{ userId?: string }>();

  const viewerId = authDetails?.user?.id;

  // IMPORTANT: explicit routing rule
  const profileId = getIDFromSlug(params?.userId)?.profileId ?? viewerId;

  const isOwnProfile = viewerId === profileId;

  return {
    viewerId,
    profileId,
    isOwnProfile,
  };
};
