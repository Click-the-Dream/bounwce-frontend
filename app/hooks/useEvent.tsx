import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { extractErrorMessage } from "../_utils/formatters";
import { onFailure, onSuccess } from "../_utils/notification";

interface ExploreEventParams {
  page_size?: number;
  keyword?: string;
  date?: string;
  location?: string;
}

const useEvent = () => {
  const { authDetails } = useAuth();
  const queryClient = useQueryClient();

  const handleFailure = (action: string, error: any) => {
    const message = extractErrorMessage(error);
    onFailure({
      title: `${action} Failed`,
      message,
    });
  };

  const handleSuccess = (action: string, message: string) => {
    onSuccess({
      title: `${action} Successful`,
      message,
    });
  };

  // EXPLORE LIVE EVENTS

  const useExploreEvents = (filters: ExploreEventParams = {}) => {
    const { page_size = 10, keyword, date, location } = filters;

    return useInfiniteQuery({
      queryKey: ["events", "explore", keyword, date, location, page_size],

      queryFn: async ({ pageParam = 1 }) => {
        const response = await api.get("/outgoing/events/events/explore", {
          params: {
            page: pageParam,
            page_size,
            keyword,
            date,
            location,
          },
        });

        return response.data;
      },

      initialPageParam: 1,

      getNextPageParam: (lastPage) => {
        const pagination = lastPage.pagination;

        if (!pagination) return undefined;

        return pagination.has_next ? pagination.page + 1 : undefined;
      },

      enabled: !!authDetails?.access_token,
    });
  };

  // GET EVENT BY ID

  const useGetEvent = (eventId: string) =>
    useQuery({
      queryKey: ["events", eventId],
      queryFn: async () => {
        const response = await api.get(`/outgoing/events/events/${eventId}`);
        return response.data.data;
      },
      enabled: !!eventId && !!authDetails?.access_token,
    });

  // USER ATTENDANCE

  const useMyAttendance = () =>
    useQuery({
      queryKey: ["events", "my-attendance"],
      queryFn: async () => {
        const response = await api.get("/outgoing/events/events/my-attendance");
        return response.data.data;
      },
      enabled: !!authDetails?.access_token,
    });

  // MY CREATED EVENTS

  const useMyEvents = () =>
    useQuery({
      queryKey: ["events", "my-events"],
      queryFn: async () => {
        const response = await api.get("/outgoing/events/events/my-events");
        return response.data.data;
      },
      enabled: !!authDetails?.access_token,
    });

  // EVENT ATTENDEES

  const useEventAttendees = (eventId: string | number) =>
    useQuery({
      queryKey: ["events", eventId, "attendees"],
      queryFn: async () => {
        const response = await api.get(
          `/outgoing/events/events/${eventId}/attendees`,
        );
        return response.data.data;
      },
      enabled: !!eventId && !!authDetails?.access_token,
    });

  // CREATE EVENT

  const createEvent = useMutation({
    mutationFn: async (eventData: any) => {
      const response = await api.post("/outgoing/events/events", eventData);

      return response.data.data;
    },

    onSuccess: () => {
      handleSuccess("Event Creation", "Event created successfully!");

      queryClient.invalidateQueries({
        queryKey: ["events"],
      });
    },

    onError: (error) => handleFailure("Event Creation", error),
  });

  // UPDATE EVENT

  const updateEvent = useMutation({
    mutationFn: async ({ id, ...eventData }: any) => {
      if (!id) throw Error("Event ID is required");

      const response = await api.put(
        `/outgoing/events/events/${id}`,
        eventData,
      );

      return response.data.data;
    },

    onSuccess: () => {
      handleSuccess("Event Update", "Event updated successfully!");

      queryClient.invalidateQueries({
        queryKey: ["events"],
      });
    },

    onError: (error) => handleFailure("Event Update", error),
  });

  // DELETE EVENT

  const deleteEvent = useMutation({
    mutationFn: async (id: string | number) => {
      if (!id) throw Error("Event ID is required");

      const response = await api.delete(`/outgoing/events/events/${id}`);

      return response.data.data;
    },

    onSuccess: () => {
      handleSuccess("Event Deletion", "Event deleted successfully!");

      queryClient.invalidateQueries({
        queryKey: ["events"],
      });
    },

    onError: (error) => handleFailure("Event Deletion", error),
  });

  // ATTEND EVENT

  const attendEvent = useMutation({
    mutationFn: async (eventId: string | number) => {
      const response = await api.post(
        `/outgoing/events/events/${eventId}/attend`,
      );

      return response.data.data;
    },

    onSuccess: () => {
      handleSuccess("Attendance", "You are attending this event!");

      queryClient.invalidateQueries({
        queryKey: ["events"],
      });
    },

    onError: (error) => handleFailure("Attendance", error),
  });

  // CANCEL ATTENDANCE

  const cancelAttendance = useMutation({
    mutationFn: async (eventId: string | number) => {
      const response = await api.post(
        `/outgoing/events/events/${eventId}/cancel`,
      );

      return response.data.data;
    },

    onSuccess: () => {
      handleSuccess(
        "Attendance Cancellation",
        "Attendance cancelled successfully!",
      );

      queryClient.invalidateQueries({
        queryKey: ["events"],
      });
    },

    onError: (error) => handleFailure("Attendance Cancellation", error),
  });

  // UPDATE EVENT STATUS

  const updateEventStatus = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string | number;
      status: string;
    }) => {
      const response = await api.patch(`/outgoing/events/events/${id}/status`, {
        status,
      });

      return response.data.data;
    },

    onSuccess: () => {
      handleSuccess("Status Update", "Event status updated successfully!");

      queryClient.invalidateQueries({
        queryKey: ["events"],
      });
    },

    onError: (error) => handleFailure("Status Update", error),
  });

  return {
    // Queries
    useExploreEvents,
    useGetEvent,
    useMyAttendance,
    useMyEvents,
    useEventAttendees,

    createEvent,
    updateEvent,
    deleteEvent,
    attendEvent,
    cancelAttendance,
    updateEventStatus,
  };
};

export default useEvent;
