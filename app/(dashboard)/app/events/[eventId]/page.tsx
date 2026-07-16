import React from "react";
import BackBtn from "../_components/BackBtn";
import EventDetails from "./_components/EventDetails";

const page = () => {
  return (
    <main className="w-full max-w-3xl bg-[#ECECF080] mx-auto min-h-screen px-4 py-8 md:px-6 border-l-[0.53px] border-r-[0.53px] mb-5 border-[#00000033]">
      {/* Back Button */}
      <BackBtn />
      <EventDetails />
    </main>
  );
};

export default page;
