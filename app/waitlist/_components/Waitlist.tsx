"use client";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import waitlistImg from "../../assets/waitlist-img.jpg";
import { Controller, useForm } from "react-hook-form";
import { LuUserRound } from "react-icons/lu";
import { MdOutlineMailOutline } from "react-icons/md";
import { MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { useMemo } from "react";
import navLogo from "../../assets/bouwnce-main.png";
import parsePhoneNumberFromString from "libphonenumber-js";
import PhoneNumberInput from "./PhoneNumberInput";
import WaitlistInsight from "../WaitlistInsight";
import Image from "next/image";
import { fadeIn, fadeUp } from "@/app/_utils/formatters";
import useWaitlist from "@/app/hooks/use-waitlist";
import Dropdown from "@/app/_components/common/Dropdown";
import Input from "@/app/_components/common/Input";
import Button from "@/app/_components/common/Button";
import Link from "next/link";

const Waitlist = () => {
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    mode: "onTouched",
    defaultValues: {
      full_name: "",
      email: "",
      phone_number: "",
      location: "",
    },
  });

  const { joinWaitlist, waitlistUser } = useWaitlist();
  const { data: waitlistData, isLoading } = waitlistUser;

  // Dynamic metrics based on live waitlist data
  const joinedCount = waitlistData?.total + 4000 || 0;
  const [animatedCount, setAnimatedCount] = useState(0);

  // Smooth count animation
  useEffect(() => {
    if (joinedCount > 0) {
      let start = 0;
      const duration = 1000;
      const increment = joinedCount / (duration / 16);

      const animate = () => {
        start += increment;
        if (start < joinedCount) {
          setAnimatedCount(Math.floor(start));
          requestAnimationFrame(animate);
        } else {
          setAnimatedCount(joinedCount);
        }
      };

      animate();
    }
  }, [joinedCount]);

  const { dailyGrowth, progressPercent } = useMemo(() => {
    const EXPECTED_USERS = Math.max(joinedCount * 2, 500);
    const growthRate = Math.min(
      0.2,
      0.05 + (1 - joinedCount / EXPECTED_USERS) * 0.15,
    );
    const dailyGrowth = Math.ceil(joinedCount * growthRate);
    const progressPercent = Math.min(
      (joinedCount / EXPECTED_USERS) * 100,
      100,
    ).toFixed(1);
    return { EXPECTED_USERS, growthRate, dailyGrowth, progressPercent };
  }, [joinedCount]);

  const onSubmit = async (data: any) => {
    joinWaitlist.mutate(data, {
      onSuccess: () => reset(),
    });
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* --- Left Illustration Section --- */}
      <motion.div
        initial="hidden"
        animate="show"
        variants={fadeIn("left", 0.1)}
        className="hidden md:block relative w-[40%] h-full overflow-hidden"
      >
        <Image
          src={waitlistImg}
          alt="workspace"
          width={500}
          height={700}
          className="w-full h-full object-cover object-top"
        />
        <motion.div
          className="absolute top-8 left-8 text-white"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Image
            src={navLogo}
            alt="bouwnce"
            width={100}
            height={24}
            className="h-5 w-auto mb-4 hidden md:block invert brightness-0"
          />
        </motion.div>

        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/30 to-transparent" />

        {/* --- Dynamic Waitlist Insight Panel --- */}
        <WaitlistInsight
          isLoading={isLoading}
          joinedCount={joinedCount}
          animatedCount={animatedCount}
          progressPercent={progressPercent}
          waitlistData={waitlistData}
        />
      </motion.div>

      {/* --- Right Content Section --- */}
      <div className="flex-1 w-full overflow-y-auto md:overflow-hidden flex flex-col items-center justify-stretch md:justify-center bg-white">
        <Image
          src={waitlistImg}
          alt="workspace"
          className="block md:hidden w-full h-48 object-cover object-top"
          width={200}
          height={200}
        />
        <div className="flex flex-col items-center justify-center w-full p-4 md:p-6 md:overflow-y-auto">
          <motion.div
            className="max-w-md flex flex-col items-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <Link href="/">
              <Image
                src={navLogo}
                alt="bouwnce"
                className="h-6 w-auto mb-4 block md:hidden"
                width={100}
                height={20}
              />
            </Link>
            <motion.h1
              variants={fadeIn("up", 0.3)}
              className="text-orange text-2xl md:text-3xl font-medium mb-2 tracking-tight text-center"
            >
              Be the first to experience Bouwnce.
            </motion.h1>

            <motion.p
              variants={fadeIn("up", 0.4)}
              className="text-sm mb-6 text-center font-medium"
            >
              Find the right people early — and everything you need along the
              way.
            </motion.p>

            {/* --- Waitlist Form --- */}
            <motion.form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4 mt-2 flex flex-col w-full max-w-82.75 pb-10"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
              }}
            >
              <motion.div variants={fadeUp}>
                <Input
                  type="text"
                  placeholder="Full name"
                  icon={<LuUserRound size={15} />}
                  error={errors.full_name?.message}
                  {...register("full_name", {
                    required: "Full name is required",
                  })}
                />
              </motion.div>

              <motion.div variants={fadeUp}>
                <Input
                  type="email"
                  placeholder="Email Address"
                  icon={<MdOutlineMailOutline size={15} />}
                  error={errors.email?.message}
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[^@\s]+@[^@\s]+\.[^@\s]+$/,
                      message: "Invalid email format",
                    },
                  })}
                />
              </motion.div>

              <motion.div variants={fadeUp}>
                <Controller
                  name="phone_number"
                  control={control}
                  rules={{
                    required: "Whatsapp number is required",
                    validate: (value) => {
                      if (!value) return "Phone number is required";

                      const phone = parsePhoneNumberFromString("+" + value);
                      if (!phone) return "Invalid phone number format";

                      if (!phone.isValid())
                        return "Invalid phone number for selected country";

                      // Optional: enforce exact national number length (Nigeria: 10 digits)
                      if (
                        phone.country === "NG" &&
                        phone.nationalNumber.length !== 10
                      ) {
                        return "Phone number must be 10 digits long";
                      }

                      return true;
                    },
                  }}
                  render={({ field }) => (
                    <PhoneNumberInput
                      {...field}
                      placeholder="Whatsapp number"
                      error={errors.phone_number?.message}
                    />
                  )}
                />
              </motion.div>

              <motion.div variants={fadeUp}>
                <Controller
                  name="location"
                  control={control}
                  rules={{ required: "Select your location" }}
                  render={({ field }) => (
                    <Dropdown
                      icon={<MapPin size={15} />}
                      options={[]}
                      placeholder="Enter your location (e.g. Lagos)"
                      error={errors.location?.message}
                      borderFocusClass=""
                      borderClass="border border-brand-orange"
                      bgClass="bg-white/50 backdrop-blur-md transition-colors duration-300"
                      radiusClass="rounded-full"
                      dropdownClass="rounded-lg border-brand-orange"
                      searchable={true}
                      searchPlaceholder="Search cities or areas..."
                      enableInternetSearch={true}
                      {...field}
                    />
                  )}
                />
              </motion.div>

              <Button
                text="Join the waitlist"
                type="submit"
                isLoading={joinWaitlist.isPending}
                disabled={joinWaitlist.isPending}
              />
            </motion.form>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Waitlist;
