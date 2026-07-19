"use client";

import {
  UseFormRegister,
  FieldErrors,
  Controller,
  Control,
} from "react-hook-form";
import { EventFormInputs } from "@/app/_utils/utility";
import CustomSelect from "./CustomSelect";

interface LocationSelectorProps {
  locationType: string;
  register: UseFormRegister<EventFormInputs>;
  errors: FieldErrors<EventFormInputs>;
  control: Control<EventFormInputs>;
}

const locationTypeOptions = [
  { value: "physical", label: "Physical" },
  { value: "virtual", label: "Virtual" },
];

export default function LocationSelector({
  locationType,
  register,
  errors,
  control,
}: LocationSelectorProps) {
  return (
    <>
      {/* Location Type Selection - Custom Dropdown */}
      <div>
        <Controller
          control={control}
          name="location_type"
          rules={{ required: "Please select a location setup" }}
          render={({ field }) => (
            <div>
              <CustomSelect
                options={locationTypeOptions}
                value={field.value}
                onChange={field.onChange}
                placeholder="Location *"
                error={!!errors.location_type}
              />
              {errors.location_type && (
                <p className="text-[11px] text-[#FF474D] mt-1">
                  {errors.location_type.message}
                </p>
              )}
            </div>
          )}
        />
      </div>

      {/* Conditional Address or Virtual Meeting Link field */}
      {locationType === "physical" && (
        <div>
          <label className="block text-xs font-medium text-gray-800 mb-2">
            Event Address <span className="text-[#FF474D]">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Landmark Event Centre, Victoria Island, Lagos"
            className={`w-full border rounded-[10px] px-4 py-3 text-xs text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-1 transition ${
              errors.location
                ? "border-[#FF474D] focus:ring-[#FF474D]"
                : "border-gray-200 focus:ring-gray-300"
            }`}
            {...register("location", {
              required:
                locationType === "physical"
                  ? "Event location address is required"
                  : false,
            })}
          />
          {errors.location && (
            <p className="text-[11px] text-[#FF474D] mt-1">
              {errors.location.message}
            </p>
          )}
        </div>
      )}

      {locationType === "virtual" && (
        <div>
          <label className="block text-xs font-medium text-gray-800 mb-2">
            Meeting Link <span className="text-[#FF474D]">*</span>
          </label>
          <input
            type="url"
            placeholder="https://meet.google.com/... or https://zoom.us/..."
            className={`w-full border rounded-[10px] px-4 py-3 text-xs text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-1 transition ${
              errors.link
                ? "border-[#FF474D] focus:ring-[#FF474D]"
                : "border-gray-200 focus:ring-gray-300"
            }`}
            {...register("link", {
              required:
                locationType === "virtual"
                  ? "A meeting connection URL is required"
                  : false,
            })}
          />
          {errors.link && (
            <p className="text-[11px] text-[#FF474D] mt-1">
              {errors.link.message}
            </p>
          )}
        </div>
      )}
    </>
  );
}
