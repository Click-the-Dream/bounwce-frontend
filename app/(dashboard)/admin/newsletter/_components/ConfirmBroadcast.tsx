import { AlertCircle, Loader2 } from "lucide-react";

const ConfirmBroadcast = ({
  setShowFinalCheck,
  formData,
  handleBroadcast,
  isBroadcasting,
}: any) => {
  return (
    <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-md z-100 flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl text-center space-y-8">
        <div className="w-16 h-16 bg-orange-50 text-[#ff3b0a] rounded-full flex items-center justify-center mx-auto">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-3xl font-bold tracking-tight">Broadcast Ready?</h2>
        <p className="text-stone-500">
          This sends "{formData.subject}" to all subscribers.
        </p>
        <div className="flex flex-col gap-3 pt-4">
          <button
            onClick={handleBroadcast}
            disabled={isBroadcasting}
            className="w-full bg-[#ff3b0a] text-white py-5 rounded-2xl font-bold hover:bg-black transition-all flex justify-center items-center gap-2 disabled:opacity-70"
          >
            {isBroadcasting ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Sending...
              </>
            ) : (
              "Confirm & Send"
            )}
          </button>
          <button
            onClick={() => setShowFinalCheck(false)}
            className="w-full py-2 text-stone-400 text-xs font-bold uppercase tracking-widest"
          >
            Back to Studio
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmBroadcast;
