import { generatePageMetadata } from "@/app/_utils/metadata";
import EventComponent from "./_components/EventComponent";

export const metadata = generatePageMetadata({
  title: "Events | Bouwnce",
  description:
    "Discover and explore events happening around you. Connect with like-minded individuals, attend workshops, and stay updated on the latest happenings in your community.",
});
const EventsPage = () => <EventComponent />;

export default EventsPage;
