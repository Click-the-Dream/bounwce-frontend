import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowLeft, Play } from "lucide-react";
import Logo from "./common/Logo";
import LoginComponents from "../(auth)/_components/LoginComponent";
import RegistrationComponent from "../(auth)/_components/RegistrationComponent";
import EmailVerification from "../(auth)/_components/EmailVerification";

const AuthModal = ({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}) => {
  const [view, setView] = useState("selection");
  const [authData, setAuthData] = useState<{ email: string } | null>(null);

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setView("selection");
      setAuthData(null);
    }, 300);
  };

  const handleSuccess = (data: { email: string }) => {
    setAuthData(data);
    setView("verification");
  };

  const fadeSlide = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { duration: 0.3 },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
        >
          <div className="absolute inset-0" onClick={handleClose} />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative z-10 w-full max-w-120 max-h-[90vh] flex flex-col rounded-lg bg-white shadow-2xl overflow-hidden"
          >
            {/* --- FIXED HEADER AREA --- */}
            <div className="relative w-full p-6 pb-0 flex items-center justify-between z-30 bg-white">
              <div className="w-10">
                {" "}
                {/* Spacer for symmetry */}
                {view !== "selection" && (
                  <button
                    onClick={() => setView("selection")}
                    className="group flex items-center justify-center w-10 h-10 rounded-full transition-colors hover:bg-gray-100 text-orange-600"
                  >
                    <ArrowLeft
                      size={20}
                      className="transition-transform group-hover:-translate-x-1"
                    />
                  </button>
                )}
              </div>

              <button
                onClick={handleClose}
                className="w-10 h-10 flex items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-black"
              >
                <X size={24} />
              </button>
            </div>

            {/* --- SCROLLABLE CONTENT AREA --- */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 pt-2 md:px-12 md:pb-12">
              <AnimatePresence mode="wait">
                {view === "selection" && (
                  <motion.div
                    key="selection"
                    {...fadeSlide}
                    className="flex flex-col items-center text-center"
                  >
                    <Logo onlyImage={true} size={40} />
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                      Welcome to Bouwnce
                    </h2>
                    <p className="mt-2 mb-8 text-sm text-gray-500">
                      Your personalized shopping companion. Get curated product
                      recommendations and effortlessly match with friends.
                    </p>
                    <div className="w-full space-y-4">
                      <button
                        onClick={() => setView("login")}
                        className="flex w-full justify-center items-center gap-2 text-sm px-3.75 py-4 bg-white text-black font-bold rounded-xl border-2 border-black transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none"
                      >
                        Log In
                      </button>
                      <button
                        onClick={() => setView("register")}
                        className="flex w-full justify-center items-center gap-2 text-sm px-3.75 py-4 bg-orange text-black font-bold rounded-xl border-2 border-black transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none"
                      >
                        Sign Up <Play size={10} fill="black" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {(view === "login" || view === "register") && (
                  <motion.div key="form" {...fadeSlide}>
                    <div className="flex justify-center mb-5">
                      <Logo onlyImage={true} size={40} />
                    </div>
                    {view === "login" ? (
                      <LoginComponents
                        isModal={true}
                        onSuccess={handleSuccess}
                      />
                    ) : (
                      <RegistrationComponent
                        isModal={true}
                        onSuccess={handleSuccess}
                      />
                    )}
                  </motion.div>
                )}

                {view === "verification" && (
                  <motion.div key="verify" {...fadeSlide}>
                    <div className="flex justify-center">
                      <Logo onlyImage={true} size={40} />
                    </div>
                    <EmailVerification
                      isModal={true}
                      email={authData?.email}
                      onFinalSuccess={() => {
                        handleClose();
                        onSuccess?.();
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <p className="mt-10 text-center text-[10px] uppercase tracking-[0.3em] text-gray-300 font-bold">
                Secured by bouwnce
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
