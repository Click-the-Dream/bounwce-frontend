import { Loader2 } from "lucide-react";

const RedirectModal = () => {
  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-black text-white">
          <Loader2 size={22} className="animate-spin" />
        </div>

        <h2 className="text-base font-semibold text-black">
          Redirecting to payment
        </h2>

        <p className="mt-2 text-sm leading-6 text-gray-500">
          Your ticket has been reserved. Please wait while we take you to
          Paystack to complete your payment.
        </p>
      </div>
    </div>
  );
};

export default RedirectModal;
