"use client";

import React from "react";
import {
  UseFormRegister,
  UseFormHandleSubmit,
  UseFormSetValue,
  Control,
  FieldErrors,
} from "react-hook-form";
import { EventFormInputs } from "@/app/_utils/utility";

import {
  BannerUpload,
  TextInput,
  TextArea,
  DateInput,
  StateSelect,
} from "./form-fields";
import { FormActions } from "./form-actions";
import LocationSelector from "./LocationSelector";
import { InterestTags } from "./interest-tags";
import { TicketSelector } from "./ticket-selector";

interface EventFormProps {
  register: UseFormRegister<EventFormInputs>;
  handleSubmit: UseFormHandleSubmit<EventFormInputs>;
  setValue: UseFormSetValue<EventFormInputs>;
  control: Control<EventFormInputs>;
  errors: FieldErrors<EventFormInputs>;

  // State
  bannerPreview: string | null;
  locationType: string;
  displayTickets: string[];
  ticketPrices: Array<{ ticket_name: string; price: string }>;

  // Handlers
  onBannerChange: (file: File | null) => void;
  onToggleTicket: (type: string) => void;
  onOpenPricingModal: () => void;
  onSubmit: (data: EventFormInputs) => Promise<void>;

  // UI state
  isLoading: boolean;
  eventInterests: string[];
}

export const EventForm: React.FC<EventFormProps> = ({
  register,
  handleSubmit,
  setValue,
  control,
  errors,
  bannerPreview,
  locationType,
  displayTickets,
  eventInterests,
  ticketPrices,
  onBannerChange,
  onToggleTicket,
  onOpenPricingModal,
  onSubmit,
  isLoading,
}) => {
  return (
    <form className="space-y-4.75" onSubmit={handleSubmit(onSubmit)}>
      <BannerUpload
        control={control}
        bannerPreview={bannerPreview}
        onBannerChange={onBannerChange}
        error={errors.banner?.message}
      />

      <TextInput
        label="Event Name"
        placeholder="e.g., Annual DevFest"
        register={register}
        fieldName="name"
        error={errors.name?.message}
        required="Event name is required"
      />

      <TextArea
        label="About Event"
        placeholder="include information about the event"
        register={register}
        fieldName="desc"
        error={errors.desc?.message}
        required="Event description is required"
      />

      <InterestTags
        register={register}
        setValue={setValue}
        eventInterests={eventInterests}
        error={errors.interests?.message}
      />

      <DateInput
        register={register}
        error={errors.date?.message}
        setValue={setValue}
      />

      <StateSelect register={register} error={errors.state?.message} />

      <TicketSelector
        register={register}
        ticketPrices={ticketPrices}
        displayTickets={displayTickets}
        onAddClick={onOpenPricingModal}
        onToggleTicket={onToggleTicket}
        error={errors.ticket_info?.message}
      />

      <LocationSelector
        locationType={locationType}
        register={register}
        errors={errors}
        control={control}
      />

      <FormActions
        isLoading={isLoading}
        onPreview={() => console.log("Preview")}
        onSaveDraft={() => console.log("Save draft")}
      />
    </form>
  );
};

export default EventForm;
