"use client";
import { EventFormInputs, TICKET_TYPES } from "@/app/_utils/utility";
import { useEventDraft } from "@/app/hooks/useEventDraft";
import { useForm } from "react-hook-form";
import RestoreLocalDraft from "../create/_components/RestoreLocalDraft";
import TicketPricingModal from "./TicketPricingModal";
import EventForm from "../create/_components/EventForm";
import BackBtn from "./BackBtn";
import useEvent from "@/app/hooks/use-events";
import { useRouter } from "next/navigation";
import useChat from "@/app/hooks/use-chat";
import { useEffect, useState } from "react";

type EventEditorProps = {
  mode: "create" | "update";
  defaultValues?: Partial<EventFormInputs>;
  eventId?: string;
};

export default function EventEditor({
  mode,
  defaultValues,
  eventId,
}: EventEditorProps) {
  const { useGetChatSignature, uploadToCloudinary } = useChat();
  const { createEvent, updateEvent } = useEvent();
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const router = useRouter();
  const { mutateAsync: getSignature, isPending: signatureLoading } =
    useGetChatSignature();
  const isSubmitting =
    (mode === "create" ? createEvent.isPending : updateEvent.isPending) ||
    signatureLoading ||
    uploadingBanner;

  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    control,
    formState: { errors },
  } = useForm<EventFormInputs>({
    defaultValues: {
      banner: null,
      name: "",
      desc: "",
      interests: [],
      date: "",
      ticket_info: [],
      location_type: "",
      location: "",
      link: null,
      state: "",
      ...defaultValues,
    },
  });

  const { showDraftModal, continueDraft, startNew, clearDraft } =
    useEventDraft<EventFormInputs>({
      watch,
      reset,
      storageKey:
        mode === "create" ? "create_event_draft" : `update_event_${eventId}`,
    });
  const [isModalOpen, setIsModalOpen] = useState(false);

  // WATCHED VALUES
  const locationType = watch("location_type");
  const eventInterests = watch("interests") || [];
  const ticketPrices = watch("ticket_info") || [];
  const selectedTickets = ticketPrices.map((item) => item.ticket_name);

  // CLEANUP
  useEffect(() => {
    return () => {
      if (bannerPreview) {
        URL.revokeObjectURL(bannerPreview);
      }
    };
  }, [bannerPreview]);

  useEffect(() => {
    if (
      mode === "update" &&
      defaultValues?.banner_url &&
      typeof defaultValues.banner_url === "string"
    ) {
      setBannerPreview(defaultValues.banner_url);
    }
  }, [mode, defaultValues]);

  // BANNER HANDLING
  const handleBannerChange = (file: File | null) => {
    if (file) {
      setValue("banner", file, { shouldValidate: true });
      const previewUrl = URL.createObjectURL(file);
      setBannerPreview(previewUrl);
    } else {
      setValue("banner", null, { shouldValidate: true });
      setBannerPreview(null);
    }
  };

  // TICKET MANAGEMENT
  const toggleTicketType = (type: string) => {
    const isSelected = selectedTickets.includes(type);
    if (isSelected) {
      const updatedPrices = ticketPrices.filter(
        (item) => item.ticket_name !== type,
      );
      setValue("ticket_info", updatedPrices, { shouldValidate: true });
    } else {
      const updatedPrices = [...ticketPrices, { ticket_name: type, price: "" }];
      setValue("ticket_info", updatedPrices, { shouldValidate: true });
    }
  };

  const setTicketPrices = (
    prices:
      | Array<{ ticket_name: string; price: string }>
      | ((
          prev: Array<{ ticket_name: string; price: string }>,
        ) => Array<{ ticket_name: string; price: string }>),
  ) => {
    const updatedPrices =
      typeof prices === "function" ? prices(ticketPrices) : prices;
    setValue("ticket_info", updatedPrices, { shouldValidate: true });
  };

  const setSelectedTickets = (
    types: string[] | ((prev: string[]) => string[]),
  ) => {
    const updatedTypes =
      typeof types === "function" ? types(selectedTickets) : types;
    const currentPrices = [...ticketPrices];

    let updatedPrices = currentPrices.filter((p) =>
      updatedTypes.includes(p.ticket_name),
    );

    updatedTypes.forEach((type) => {
      const exists = updatedPrices.some((p) => p.ticket_name === type);
      if (!exists) {
        updatedPrices.push({ ticket_name: type, price: "" });
      }
    });

    setValue("ticket_info", updatedPrices, { shouldValidate: true });
  };

  const displayTickets = [
    ...TICKET_TYPES,
    ...selectedTickets.filter((t) => !TICKET_TYPES.includes(t)),
  ];
  const handleSuccess = () => {
    clearDraft();

    if (mode === "create") {
      reset();
      setBannerPreview(null);
      router.push("/app/events");
    } else {
      router.refresh();
    }
  };
  // FORM SUBMISSION
  const onSubmit = async (data: EventFormInputs) => {
    try {
      let bannerUrl = data.banner_url || "";

      if (data.banner instanceof File) {
        setUploadingBanner(true);

        const signature = await getSignature({
          upload_type: "image",
          count: 1,
        });

        const uploaded = await uploadToCloudinary(data.banner, signature);

        bannerUrl = uploaded.secure_url;

        setUploadingBanner(false);
      }

      const payload = {
        ...data,
        price: 0,
        banner_url: bannerUrl,
      };

      if (mode === "create") {
        createEvent.mutate(payload, {
          onSuccess: handleSuccess,
        });
      } else {
        updateEvent.mutate(
          {
            id: eventId,
            ...payload,
          },
          {
            onSuccess: handleSuccess,
          },
        );
      }
    } catch (error) {
      setUploadingBanner(false);
      console.error(
        `Error ${mode === "create" ? "creating" : "updating"} event:`,
        error,
      );
    }
  };

  const startNewEvent = () => {
    startNew();

    reset({
      banner: null,
      name: "",
      desc: "",
      interests: [],
      date: "",
      ticket_info: [],
      location_type: "",
      location: "",
      link: null,
      state: "",
    });
  };

  return (
    <div
      className="min-h-screen max-w-170 mx-auto px-6 py-8 border-l-[0.53px] border-r-[0.53px] mb-5"
      style={{ borderColor: "#00000033" }}
    >
      <BackBtn />

      <div className="mb-8">
        <h1 className="text-2xl font-medium text-gray-900 tracking-tight">
          {mode === "create" ? "Create a New Event" : "Update Event"}
        </h1>

        <p className="text-[13px] text-gray-400 mt-1">
          {mode === "create"
            ? "Send a broadcast request for your upcoming events"
            : "Update your event information"}
        </p>
      </div>

      <EventForm
        mode={mode}
        watch={watch}
        register={register}
        handleSubmit={handleSubmit}
        setValue={setValue}
        control={control}
        errors={errors}
        bannerPreview={bannerPreview}
        locationType={locationType}
        displayTickets={displayTickets}
        ticketPrices={ticketPrices}
        onBannerChange={handleBannerChange}
        eventInterests={eventInterests}
        onToggleTicket={toggleTicketType}
        onOpenPricingModal={() => setIsModalOpen(true)}
        onSubmit={onSubmit}
        isLoading={isSubmitting}
      />

      <TicketPricingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedTickets={selectedTickets}
        ticketPrices={ticketPrices}
        toggleTicketType={toggleTicketType}
        setTicketPrices={setTicketPrices}
        setSelectedTickets={setSelectedTickets}
      />
      {showDraftModal && (
        <RestoreLocalDraft
          mode={mode}
          discardDraft={startNewEvent}
          continueDraft={continueDraft}
        />
      )}
    </div>
  );
}
