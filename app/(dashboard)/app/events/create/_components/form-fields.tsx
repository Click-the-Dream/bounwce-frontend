import React, { useEffect, useRef, useState } from "react";
import {
  Controller,
  UseFormRegister,
  Control,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
import { Calendar, Clock, UploadCloud } from "lucide-react";
import { EventFormInputs } from "@/app/_utils/utility";

//  BANNER UPLOAD
interface BannerUploadProps {
  watch: UseFormWatch<any>;
  control: Control<EventFormInputs>;
  bannerPreview: string | null;
  onBannerChange: (file: File | null) => void;
  error?: string;
}

export const BannerUpload: React.FC<BannerUploadProps> = ({
  control,
  bannerPreview,
  onBannerChange,
  error,
  watch,
}) => {
  const bannerUrl = watch("banner_url");
  return (
    <div>
      <label className="block text-xs font-medium text-gray-800 mb-2">
        Event Banner <span className="text-[#FF474D]">*</span>
      </label>

      <Controller
        control={control}
        name="banner"
        rules={{
          validate: (value) => {
            if (!value && !bannerUrl && !bannerPreview) {
              return "Event banner is required";
            }

            return true;
          },
        }}
        render={() => (
          <div
            className={`border-2 border-dashed rounded-[10px] p-4 flex flex-col items-center justify-center transition relative overflow-hidden ${
              error
                ? "border-[#FF474D] bg-red-50/10"
                : "border-gray-200 bg-gray-50/30"
            }`}
          >
            {bannerPreview || bannerUrl ? (
              <div className="relative w-full h-28">
                <img
                  src={bannerPreview || bannerUrl || ""}
                  alt="Event banner preview"
                  className="w-full h-full object-cover rounded-lg"
                />

                <button
                  type="button"
                  onClick={() => onBannerChange(null)}
                  className="absolute top-2 right-2 bg-black/60 text-white text-xs px-3 py-1 rounded-md hover:bg-black/80"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label
                htmlFor="banner-upload"
                className="flex flex-col items-center justify-center cursor-pointer w-full h-28"
              >
                <UploadCloud
                  className="text-gray-400 mb-2"
                  size={28}
                  strokeWidth={1.5}
                />

                <p className="text-xs text-gray-500">
                  Click to upload or drag and drop
                </p>

                <p className="text-[10px] text-gray-400 mt-1">
                  PNG, JPG up to 10MB
                </p>

                <input
                  id="banner-upload"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => onBannerChange(e.target.files?.[0] || null)}
                />
              </label>
            )}
          </div>
        )}
      />

      {error && <p className="text-[11px] text-[#FF474D] mt-1">{error}</p>}
    </div>
  );
};

//  TEXT INPUT
interface TextInputProps {
  label: string;
  placeholder: string;
  register: UseFormRegister<EventFormInputs>;
  fieldName: keyof EventFormInputs;
  error?: string;
  required?: string;
}

export const TextInput: React.FC<TextInputProps> = ({
  label,
  placeholder,
  register,
  fieldName,
  error,
  required,
}) => (
  <div>
    <label className="block text-xs font-medium text-gray-800 mb-2">
      {label} <span className="text-[#FF474D]">*</span>
    </label>
    <input
      type="text"
      placeholder={placeholder}
      className={`w-full border rounded-[10px] px-4 py-3 text-xs text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-[0.53px] transition ${
        error
          ? "border-[#FF474D] focus:ring-[#FF474D]"
          : "border-gray-200 focus:ring-gray-300"
      }`}
      {...register(fieldName, { required })}
    />
    {error && <p className="text-[11px] text-[#FF474D] mt-1">{error}</p>}
  </div>
);

//  TEXTAREA
interface TextAreaProps {
  label: string;
  placeholder: string;
  register: UseFormRegister<EventFormInputs>;
  fieldName: keyof EventFormInputs;
  error?: string;
  required?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({
  label,
  placeholder,
  register,
  fieldName,
  error,
  required,
}) => (
  <div>
    <label className="block text-xs font-medium text-gray-800 mb-2">
      {label} <span className="text-[#FF474D]">*</span>
    </label>
    <textarea
      rows={4}
      placeholder={placeholder}
      className={`w-full h-36.25 border rounded-[10px] px-4 py-3 text-xs text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-[0.53px] transition resize-none ${
        error
          ? "border-[#FF474D] focus:ring-[#FF474D]"
          : "border-gray-200 focus:ring-gray-300"
      }`}
      {...register(fieldName, { required })}
    />
    {error && <p className="text-[11px] text-[#FF474D] mt-1">{error}</p>}
  </div>
);

//  DATE INPUT
interface DateInputProps {
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  watch: UseFormWatch<any>;
  error?: string;
}

export const DateInput: React.FC<DateInputProps> = ({
  register,
  error,
  setValue,
  watch,
}) => {
  const dateRef = useRef<HTMLInputElement>(null);
  const timeRef = useRef<HTMLInputElement>(null);

  const formDate = watch("date");

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  useEffect(() => {
    if (formDate) {
      const [savedDate, savedTime] = formDate.split("T");

      setDate(savedDate || "");
      setTime(savedTime?.slice(0, 5) || "");
    }
  }, [formDate]);

  const updateDateTime = (newDate: string, newTime: string) => {
    setValue("date", newDate && newTime ? `${newDate}T${newTime}` : newDate, {
      shouldValidate: true,
    });
  };

  return (
    <div>
      <input
        type="hidden"
        {...register("date", {
          required: "Date and start time are required",
        })}
      />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-800 mb-2">
            Date <span className="text-[#FF474D]">*</span>
          </label>

          <div className="relative">
            <input
              ref={dateRef}
              type="date"
              className="hide-picker-icon w-full border rounded-[10px] pl-4 pr-10 py-3 text-xs text-gray-900 border-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-300"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                updateDateTime(e.target.value, time);
              }}
            />

            <Calendar
              size={16}
              onClick={() => dateRef.current?.showPicker()}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-800 mb-2">
            Start Time <span className="text-[#FF474D]">*</span>
          </label>

          <div className="relative">
            <input
              ref={timeRef}
              type="time"
              className="hide-picker-icon w-full border rounded-[10px] pl-4 pr-10 py-3 text-xs text-gray-900 border-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-300"
              value={time}
              onChange={(e) => {
                setTime(e.target.value);
                updateDateTime(date, e.target.value);
              }}
            />

            <Clock
              size={16}
              onClick={() => timeRef.current?.showPicker()}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {error && <p className="text-[11px] text-[#FF474D] mt-1">{error}</p>}
    </div>
  );
};
