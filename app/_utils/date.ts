import { format } from "date-fns";

export const mapDateFilter = (
  selection: {
    type: string;
    key: any;
    start: string | number | Date;
    end: string | number | Date;
    date: string | number | Date;
  } | null,
) => {
  if (!selection) {
    return { date_range: "yesterday" };
  }

  if (selection.type === "preset") {
    switch (selection.key) {
      case "today":
        return { date_range: "today" };
      case "yesterday":
        return { date_range: "yesterday" };
      case "last7":
        return { date_range: "last_7_days" };
      case "last30":
        return { date_range: "last_30_days" };
      case "thisMonth":
        return { date_range: "this_month" };
      default:
        return { date_range: selection.key };
    }
  }

  if (selection.type === "range" && selection.start && selection.end) {
    const startDate = format(selection.start, "yyyy-MM-dd");
    const endDate = format(selection.end, "yyyy-MM-dd");

    return {
      date_range: "custom",
      start_date: startDate,
      end_date: endDate,
    };
  }

  if (selection.type === "single" && selection.date) {
    const date = format(selection.date, "yyyy-MM-dd");

    return {
      date_range: "custom",
      start_date: date,
      end_date: date,
    };
  }

  return {};
};

export const getComparisonLabel = (
  selection: { type: string; key: any } | null,
) => {
  if (!selection || selection.type !== "preset") {
    return "from yesterday";
  }

  switch (selection.key) {
    case "yesterday":
    case "today":
      return "from previous day";
    case "last7":
      return "from previous week";
    case "last30":
      return "from previous period";
    case "thisMonth":
      return "from previous month";
    default:
      return "from previous period";
  }
};

export function formatEventDate(date: string) {
  if (!date) return;
  const formatted = new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return formatted;
}

export const formatEventTime = (dateString?: string) => {
  console.log(dateString);

  if (!dateString) return "";

  const [, time] = dateString.split("T");

  const [hour, minute] = time.split(":");

  const date = new Date();
  date.setHours(Number(hour));
  date.setMinutes(Number(minute));

  return date.toLocaleTimeString("en-NG", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};
