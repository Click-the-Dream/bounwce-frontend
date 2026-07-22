interface RestoreLocalDraftProps {
  discardDraft: () => void;
  continueDraft: () => void;
  mode?: "create" | "update";
}

const RestoreLocalDraft = ({
  discardDraft,
  continueDraft,
  mode = "create",
}: RestoreLocalDraftProps) => {
  const isUpdate = mode === "update";

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-sm">
        <h2 className="font-semibold text-black text-sm">
          {isUpdate ? "Continue previous changes?" : "Continue previous event?"}
        </h2>

        <p className="text-xs text-gray-500 mt-2">
          {isUpdate
            ? "We found unfinished changes for this event. Would you like to continue editing?"
            : "We found an unfinished event draft. Would you like to continue?"}
        </p>

        <div className="flex gap-3 mt-5">
          <button
            onClick={discardDraft}
            className="cursor-pointer flex-1 border rounded-lg py-2 text-xs hover:bg-gray-50 transition"
          >
            {isUpdate ? "Discard Changes" : "Start New"}
          </button>

          <button
            onClick={continueDraft}
            className="cursor-pointer flex-1 bg-[#FF474D] text-white rounded-lg py-2 text-xs hover:bg-[#e03e43] transition"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default RestoreLocalDraft;
