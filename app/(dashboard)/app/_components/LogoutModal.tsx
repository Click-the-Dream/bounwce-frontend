import { Portal } from "@/app/protocols/Portal";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut } from "lucide-react";

const LogoutModal = ({
  open,
  onConfirm,
  onCancel,
  isLoading,
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}) => (
  <Portal>
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-100 bg-black/30 backdrop-blur-[2px] flex items-center"
            onClick={onCancel}
          />

          {/* Dialog */}
          <motion.div
            key="dialog"
            initial={{ opacity: 0, scale: 0.94, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 8 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            className="fixed z-101 left-0 right-0 top-0 bottom-0 m-auto
                     w-[calc(100vw-2rem)] max-w-sm h-max bg-white rounded-2xl shadow-xl
                     border border-[#00000014] p-6 flex flex-col items-center gap-4"
          >
            {/* Icon */}
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 border border-red-100">
              <LogOut size={20} className="text-red-500" />
            </div>

            {/* Copy */}
            <div className="text-center space-y-1">
              <h2 className="text-[15px] font-semibold text-gray-900 tracking-tight">
                Log out of Bouwnce?
              </h2>
              <p className="text-[13px] text-[#6B7280] leading-relaxed">
                You'll need to sign in again to access your account.
              </p>
            </div>

            {/* Actions */}
            <div className="flex w-full gap-2.5 mt-1">
              <button
                onClick={onCancel}
                disabled={isLoading}
                className="flex-1 py-2.5 rounded-[9px] text-[13px] font-medium
                         border border-[#E5E7EB] text-[#374151] bg-white
                         hover:bg-[#F9FAFB] active:scale-[0.98] transition-all duration-150
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className="flex-1 py-2.5 rounded-[9px] text-[13px] font-medium
                         bg-red-500 text-white
                         hover:bg-red-600 active:scale-[0.98] transition-all duration-150
                         disabled:opacity-70 disabled:cursor-not-allowed
                         flex items-center justify-center gap-1.5"
              >
                {isLoading ? (
                  <>
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.7,
                        ease: "linear",
                      }}
                      className="inline-block w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full"
                    />
                    Logging out…
                  </>
                ) : (
                  "Log out"
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  </Portal>
);

export default LogoutModal;
