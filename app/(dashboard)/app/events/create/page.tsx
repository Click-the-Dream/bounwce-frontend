"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { EventFormInputs, TICKET_TYPES } from "@/app/_utils/utility";
import EventForm from "./_components/EventForm";
import TicketPricingModal from "../_components/TicketPricingModal";
import BackBtn from "../_components/BackBtn";
import useChat from "@/app/hooks/use-chat";
import useEvent from "@/app/hooks/useEvent";
import { useRouter } from "next/navigation";

export default function CreateEventPage() {
  const { useGetChatSignature, uploadToCloudinary } = useChat();
  const { createEvent } = useEvent();
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const router = useRouter();
  // FORM SETUP
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
    },
  });

  // HOOKS
  const { mutateAsync: getSignature, isPending: signatureLoading } =
    useGetChatSignature();
  const isCreatingEvent =
    createEvent.isPending || signatureLoading || uploadingBanner;

  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
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

  // FORM SUBMISSION
  const onSubmit = async (data: EventFormInputs) => {
    try {
      let bannerUrl = "";

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

      createEvent.mutate({
        ...data,
        price: 0,
        banner_url: bannerUrl,
        onSuccess: () => {
          reset();

          setBannerPreview(null);

          router.push("/app/events");
        },
      });
    } catch (error) {
      setUploadingBanner(false);
      console.error("Error creating event:", error);
    }
  };

  // RENDER
  return (
    <div
      className="min-h-screen max-w-170 mx-auto px-6 py-8 border-l-[0.53px] border-r-[0.53px] mb-5"
      style={{ borderColor: "#00000033" }}
    >
      <BackBtn />

      <div className="mb-8">
        <h1 className="text-2xl font-medium text-gray-900 tracking-tight">
          Create a New Event
        </h1>
        <p className="text-[13px] text-gray-400 mt-1">
          Send a broadcast request for your upcoming events
        </p>
      </div>

      <EventForm
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
        isLoading={isCreatingEvent}
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
    </div>
  );
}
