"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react"; // Or any icon library you use
import BouwnceDemo from "./BouwnceDemo";

const STEPS = [
  {
    id: 1,
    title: "Meet People",
    description:
      "From technology and entrepreneurship to fitness, creativity, and everyday interests, discover people you can connect with, learn from, and share experiences with.",
  },
  {
    id: 2,
    title: "Discover Shared Interests",
    description:
      "Find people who enjoy the things you do, explore new interests, and connect over the things that matter to you. Every shared interest is an opportunity to start a conversation.",
  },
  {
    id: 3,
    title: "Explore Experiences",
    description:
      "Discover events, activities, and experiences that match your interests. Find something exciting to do, meet people along the way, and create memories worth sharing.",
  },
  {
    id: 4,
    title: "Turn Connections Into Action",
    description:
      "Start conversations, make plans, and share experiences. Because sometimes, one interaction is all it takes to get things moving.",
  },
];

const INTERVAL_TIME = 4000;

const AboutSection = () => {
  const [activeStep, setActiveStep] = useState(1);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    if (!isInView) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev % STEPS.length) + 1);
    }, INTERVAL_TIME);
    return () => clearInterval(interval);
  }, [isInView]);

  return (
    <motion.section
      onViewportEnter={() => setIsInView(true)}
      onViewportLeave={() => setIsInView(false)}
      className="relative flex flex-col items-center bg-white transition-colors duration-300 overflow-hidden"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 items-center min-h-250 max-w-250">
        <div className="flex flex-col max-w-100.5 md:max-w-125.5 justify-center space-y-12 bg-[#F9F9F9] h-full p-10 border-l-[0.53px] border-r-[0.53px] border-dashed border-[#BDBDBD]">
          <header className="space-y-4">
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-xl lg:text-[24px] font-bold leading-[1.05] tracking-tight text-black"
            >
              Bouwnce brings people together around shared interests, making it
              easier to explore beyond your usual circle.
            </motion.h2>
            <p className="text-sm text-[#949494] font-medium">
              There's always someone new to meet, something new to discover, or
              an experience waiting to be explored.
            </p>
          </header>

          <div className="relative flex flex-col">
            {STEPS.map((step, index) => {
              const isActive = activeStep === step.id;
              const isLast = index === STEPS.length - 1;
              const isCompleted = activeStep > step.id;
              return (
                <div
                  key={step.id}
                  onClick={() => setActiveStep(step.id)}
                  className="relative flex gap-6 cursor-pointer min-h-32.5 group"
                >
                  {/* The Line Logic */}
                  {!isLast && (
                    <div className="absolute left-[13.5px] top-8 bottom-0 w-px bg-[#E5E5E5]">
                      {/* This is the "Filling" Progress Bar */}
                      {isActive && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: "100%" }}
                          transition={{
                            duration: INTERVAL_TIME / 1000,
                            ease: "linear",
                          }}
                          className="w-full bg-[#FF4B2B]"
                        />
                      )}
                      {isCompleted && (
                        <div className="absolute inset-0 bg-[#FF4B2B]" />
                      )}
                    </div>
                  )}

                  {/* The Number Circle */}
                  <div className="relative z-10 shrink-0 pt-1">
                    <motion.div
                      initial={false}
                      animate={{
                        backgroundColor:
                          isActive || isCompleted ? "#FF4B2B" : "#C9C9C9",
                        scale: isActive ? 1.1 : 1,
                      }}
                      className="w-7 h-7 flex items-center justify-center text-xs font-bold shadow-sm transition-colors"
                    >
                      <AnimatePresence mode="wait">
                        {isCompleted ? (
                          <motion.div
                            key="check"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                          >
                            <Check size={14} strokeWidth={3} color="white" />
                          </motion.div>
                        ) : (
                          <motion.span
                            key="number"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{ color: isActive ? "#fff" : "#949494" }}
                          >
                            {step.id}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </div>

                  {/* The Content */}
                  <div className="flex-1 pb-10">
                    <motion.h3
                      className={`text-sm tracking-tight text-black ${isActive ? "font-bold" : "font-medium"}`}
                    >
                      {step.title}
                    </motion.h3>

                    <AnimatePresence mode="wait">
                      {isActive && (
                        <motion.p
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: 5 }}
                          className="text-[13px] leading-relaxed max-w-87.5 whitespace-pre-line mt-2 text-[#949494]"
                        >
                          {step.description}
                        </motion.p>
                      )}
                      {!isActive && (
                        <p className="text-[13px] leading-relaxed max-w-87.5 mt-2 text-[#949494] opacity-40">
                          {step.description.split("\n")[0]}...
                        </p>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: The Phone Mockup */}
        <section className="h-full w-full max-w-100.5 md:max-w-125.5 flex justify-center items-center border-r-[0.53px] border-[#BDBDBD] border-dashed p-3 md:p-5">
          <div className="p-4 md:p-6 rounded-[40px] bg-[#F7F7F7] w-full h-137.5 shadow-inner">
            <BouwnceDemo />
          </div>
        </section>
      </div>
    </motion.section>
  );
};

export default AboutSection;
