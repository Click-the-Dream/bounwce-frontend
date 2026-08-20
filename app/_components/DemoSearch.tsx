"use client";
import { motion } from "framer-motion";

const DemoSearch = () => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center h-full w-full px-1 md:px-6"
  >
    {/* Abstract Logo/Header Pattern */}
    <div className="flex flex-col items-center gap-2 mb-12">
      <div className="w-48 h-3 bg-gray-100 rounded-full" />
      <div className="w-32 h-4 bg-gray-50 rounded-full" />
      <div className="w-24 h-5 bg-gray-50/50 rounded-full" />
    </div>

    {/* The Search Bar */}
    <div className="w-full max-w-md flex items-center border border-gray-200/50 bg-white text-gray-700 px-1 py-0.5 shadow-sm overflow-hidden rounded-[2.5px]">
      <div className="bg-[#F4F4F5] text-gray-700 flex items-center w-full rounded-[2.5px] px-2 py-1">
        <div className="pl-3 pr-2 text-gray-400">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </div>
        <input
          readOnly
          value="I want to connect with"
          className="flex-1 text-[8px] outline-none placeholder:text-gray-400 font-medium bg-transparent"
        />
      </div>
      <button className="ml-1 bg-[#FF5030] hover:bg-[#e4462a] text-black font-semibold px-2 md:px-4 py-1 rounded border border-black transition-all active:scale-[0.98] text-[8px] md:text-[10px] flex items-center justify-center">
        <span className="lg:block">Search</span>
      </button>
    </div>
  </motion.div>
);

export default DemoSearch;
