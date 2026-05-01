import { generatePageMetadata } from "@/app/_utils/metadata";
import ProfilePage from "../_components/ProfilePage";
import { profileFetcher } from "@/app/_utils/server_functions/fetchers";

export const generateMetadata = async ({ params }: any) => {
  const { userId } = await params;
  const profile = await profileFetcher(userId);
  if (!profile) {
    return generatePageMetadata({
      title: "Profile Not Found | Bouwnce",
      description: "The requested profile could not be found.",
      noIndex: true,
    });
  }

  return generatePageMetadata({
    title: `${profile.name} | Bouwnce`,
    description: `View ${profile.name}'s profile on Bouwnce. Explore their activity, interests, and connections within the Bouwnce community.`,
  });
};

const page = () => {
  return <ProfilePage />;
};

export default page;
