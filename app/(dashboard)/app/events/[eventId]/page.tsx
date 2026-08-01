import { generatePageMetadata } from "@/app/_utils/metadata";
import BackBtn from "../_components/BackBtn";
import EventDetailsPage from "./_components/EventDetails";
import { eventFetcher } from "@/app/_utils/server_functions/fetchers";

export const generateMetadata = async ({ params }: any) => {
  const { eventId } = await params;
  if (!eventId) {
    return generatePageMetadata({ title: "Event Not Found", noIndex: true });
  }
  try {
    const event = await eventFetcher(eventId);
    if (!event) {
      return generatePageMetadata({ title: "Event Not Found", noIndex: true });
    }
    return generatePageMetadata({
      title: event.name,
      description: event.desc,
      imageUrl: event.banner_url,
      keywords: event.interests,
    });
  } catch (err) {
    console.error("Failed to fetch event metadata:", err);
    return generatePageMetadata({ title: "Event Not Found", noIndex: true });
  }
};

const page = () => {
  return (
    <main className="w-full max-w-3xl bg-[#ECECF080] mx-auto min-h-screen px-4 py-8 md:px-6 border-l-[0.53px] border-r-[0.53px] mb-5 border-[#00000033]">
      {/* Back Button */}
      <BackBtn />
      <EventDetailsPage />
    </main>
  );
};

export default page;
