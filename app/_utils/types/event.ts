export interface TicketInfo {
  price: number;
  ticket_name: string;
  ticket_description: string | null;
}

export interface Event {
  id: string;
  name: string;
  desc: string | null;
  date: string;
  location: string;
  location_type: "physical" | "virtual" | string;
  link: string | null;
  banner_url: string | null;
  state: "live" | "draft" | "ended" | string;
  ticket_info: TicketInfo[];
  interests: string[];
  creator_id: string;
  created_at: string;
  updated_at: string;
}
