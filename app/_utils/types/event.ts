export interface Event {
  id: string;
  title: string;
  image: string;
  status: "UPCOMING" | "PAST";
  date: string;
  location: string;
  attendeesCount: number;
  attendeeAvatars: string[];
}
