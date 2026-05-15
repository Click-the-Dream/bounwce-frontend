import { generatePageMetadata } from "@/app/_utils/metadata";
import ProfilePage from "./_components/ProfilePage";

export const metadata = generatePageMetadata({
  title: "Profile | Bouwnce",
  description:
    "View and manage your Bouwnce profile, track your activity, and showcase your interests and connections.",
});

const page = () => {
  return <ProfilePage />;
};

export default page;
