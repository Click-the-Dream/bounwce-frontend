import { generatePageMetadata } from "@/app/_utils/metadata";
import ProfilePage from "../_components/ProfilePage";
import { profileFetcher } from "@/app/_utils/server_functions/fetchers";

export const generateMetadata = async ({ params }: any) => {
  const { userId } = await params;

  try {
    const profile = await profileFetcher(userId);

    return generatePageMetadata({
      title: `${profile?.full_name || userId}`,
      description: `View ${profile?.full_name || userId}'s profile on Bouwnce.`,
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
