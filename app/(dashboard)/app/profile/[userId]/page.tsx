import { generatePageMetadata } from "@/app/_utils/metadata";
import ProfilePage from "../_components/ProfilePage";
import { profileFetcher } from "@/app/_utils/server_functions/fetchers";
import { getIDFromSlug } from "@/app/_utils/slugify";

export const generateMetadata = async ({ params }: any) => {
  const { userId } = await params;

  // Extract and ensure it is a string
  const result = getIDFromSlug(userId);
  const profileID = result?.profileId;

  // Add this guard clause:
  if (!profileID) {
    return generatePageMetadata({
      title: "Profile Not Found",
      noIndex: true,
    });
  }

  try {
    const profile = await profileFetcher(profileID);

    return generatePageMetadata({
      title: `${profile?.full_name || userId}`,
      description:
        profile?.bio ??
        `View ${profile?.full_name || userId}'s profile on Bouwnce.`,
      imageUrl: profile?.profile_pic?.url,
    });
  } catch {
    return generatePageMetadata({
      title: `${userId}`,
      noIndex: true,
    });
  }
};

const page = () => {
  return <ProfilePage />;
};

export default page;
