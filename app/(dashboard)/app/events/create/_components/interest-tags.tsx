import React, { useState } from "react";
import { UseFormRegister, UseFormSetValue } from "react-hook-form";
import { EventFormInputs } from "@/app/_utils/utility";

interface InterestTagsProps {
  register: UseFormRegister<EventFormInputs>;
  setValue: UseFormSetValue<EventFormInputs>;
  eventInterests: string[];
  error?: string;
}

export const InterestTags: React.FC<InterestTagsProps> = ({
  register,
  setValue,
  eventInterests,
  error,
}) => {
  const [interestInput, setInterestInput] = useState("");

  const handleInterestChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.includes(",")) {
      const parts = value.split(",");
      const tagCandidate = parts[0].trim();

      if (tagCandidate && !eventInterests.includes(tagCandidate)) {
        setValue("interests", [...eventInterests, tagCandidate], {
          shouldValidate: true,
        });
      }
      setInterestInput(parts.slice(1).join(","));
    } else {
      setInterestInput(value);
    }
  };

  const handleInterestKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && interestInput.trim()) {
      e.preventDefault();
      const cleanInput = interestInput.trim();

      if (!eventInterests.includes(cleanInput)) {
        setValue("interests", [...eventInterests, cleanInput], {
          shouldValidate: true,
        });
      }
      setInterestInput("");
    }
  };

  const removeInterest = (interest: string) => {
    setValue(
      "interests",
      eventInterests.filter((item: string) => item !== interest),
      { shouldValidate: true },
    );
  };

  return (
    <div>
      <label className="block text-xs font-medium text-gray-800 mb-2">
        Event Interest <span className="text-[#FF474D]">*</span>
      </label>
      <div
        className={`w-full min-h-11.5 border rounded-[10px] px-3 py-2 flex flex-wrap items-center gap-2 ${
          error ? "border-[#FF474D]" : "border-gray-200"
        }`}
      >
        {eventInterests.map((interest: string) => (
          <span
            key={interest}
            className="flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-md px-2 py-1 text-[11px] text-gray-600"
          >
            {interest}
            <button
              type="button"
              onClick={() => removeInterest(interest)}
              className="text-sm text-gray-400 hover:text-gray-700"
            >
              ×
            </button>
          </span>
        ))}

        <input
          value={interestInput}
          onChange={handleInterestChange}
          onKeyDown={handleInterestKeyDown}
          placeholder={eventInterests.length ? "" : "e.g. Entertainment, Party"}
          className="flex-1 min-w-30 text-xs outline-none bg-transparent"
        />
      </div>
      <input
        type="hidden"
        {...register("interests", {
          validate: (value: string[]) =>
            (value && value.length > 0) || "At least one interest is required",
        })}
      />
      {error && <p className="text-[11px] text-[#FF474D] mt-1">{error}</p>}
    </div>
  );
};
