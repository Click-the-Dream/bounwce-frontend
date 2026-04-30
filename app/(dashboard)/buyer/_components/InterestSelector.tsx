import { onFailure } from "@/app/_utils/notification";
import useInterest from "@/app/hooks/use-interest";
import { useEffect, useState } from "react";

const InterestSelector = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    useGetAvailableInterests,
    useGetUserInterests,
    addUserInterests,
    updateUserInterests,
  } = useInterest();

  const {
    data: availableData,
    isLoading: isLoadingAvailable,
    isError: isErrorAvailable,
    refetch: refetchAvailableInterests,
  } = useGetAvailableInterests();

  const {
    data: userData,
    isLoading: isLoadingUser,
    isError: isErrorUser,
    refetch: refetchUserInterests,
  } = useGetUserInterests();

  const isLoading = isLoadingAvailable || isLoadingUser;
  const isError = isErrorAvailable || isErrorUser;

  const safeAvailable = availableData ?? [];
  const safeUser = userData ?? [];

  const [selected, setSelected] = useState<Record<string, string[]>>({});

  useEffect(() => {
    const hasInterests = safeUser.length > 0;
    setIsOpen(!hasInterests);
  }, [safeUser]);

  useEffect(() => {
    if (!safeUser.length) return;

    const formatted: Record<string, string[]> = {};

    safeUser.forEach((item: any) => {
      const key = item.category?.toLowerCase().replace(/\s/g, "_");
      formatted[key] = item.interests;
    });

    setSelected(formatted);
  }, [safeUser]);

  const categories = safeAvailable.map((item: any) => ({
    id: item.category?.toLowerCase().replace(/\s/g, "_"),
    title: item.category,
    options: item.interests,
  }));

  const toggleInterest = (categoryId: string, option: string) => {
    setSelected((prev) => {
      const current = prev[categoryId] || [];
      const exists = current.includes(option);

      return {
        ...prev,
        [categoryId]: exists
          ? current.filter((i) => i !== option)
          : [...current, option],
      };
    });
  };

  const handleSave = async () => {
    setSubmitError(null);

    console.log(selected);

    const payload = {
      interests: Object.values(selected).flat().filter(Boolean),
    };

    if (!payload.interests.length) {
      setSubmitError("Please select at least one interest.");
      return;
    }

    try {
      if (safeUser.length > 0) {
        await updateUserInterests.mutateAsync(payload as any);
      } else {
        await addUserInterests.mutateAsync(payload as any);
      }

      setIsOpen(false);
    } catch (err: any) {
      console.error("Interest save failed:", err);

      onFailure({
        title: "Save failed",
        message:
          err?.response?.data?.message ||
          "We couldn't save your interests. Please try again.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="bg-white px-6 py-5 rounded-xl shadow-lg flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium text-gray-700">
            Loading interests...
          </span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="bg-white px-6 py-5 rounded-xl shadow-lg text-center max-w-sm">
          <p className="text-red-500 font-semibold mb-2">
            Failed to load interests
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Please check your connection and try again.
          </p>
          <button
            onClick={() => {
              refetchAvailableInterests();
              refetchUserInterests();
            }}
            className="bg-orange text-white px-4 py-2 rounded-lg text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-gray-200/80 backdrop-blur-sm p-4 font-sans">
      <div className="bg-white rounded-2xl shadow-xl max-w-294.75 w-full max-h-[95vh] overflow-y-auto p-8.5 relative">
        {/* Header */}
        <header className="mb-7.25 text-center text-black">
          <h1 className="text-[20px] font-semibold mb-2.25">
            Browse Your Interest
          </h1>
          <p className="text-sm max-w-md mx-auto leading-relaxed">
            Select at least 1 interest in each category
          </p>
        </header>

        {/* ERROR ON SUBMIT */}
        {submitError && (
          <div className="mb-4 text-sm text-red-500 text-center">
            {submitError}
          </div>
        )}

        {/* Categories */}
        <div className="space-y-9.5">
          {categories.map((category: any) => (
            <section key={category.id} className="text-center">
              <h2 className="text-sm font-semibold text-black mb-5">
                {category.title}
              </h2>

              <div className="flex flex-wrap justify-center gap-3">
                {category.options.map((option: string) => {
                  const isSelected = selected?.[category.id]?.includes(option);

                  return (
                    <button
                      key={option}
                      onClick={() => toggleInterest(category.id, option)}
                      className={`cursor-pointer px-5 py-2.5 text-sm border-2 transition-all ${
                        isSelected
                          ? "border-orange-500 bg-white"
                          : "border-transparent bg-[#F4F4F4]"
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-16 flex justify-end">
          <button
            onClick={handleSave}
            disabled={
              addUserInterests.isPending || updateUserInterests.isPending
            }
            className="cursor-pointer bg-orange text-white py-2.5 px-7.5 rounded-lg disabled:opacity-50"
          >
            {addUserInterests.isPending || updateUserInterests.isPending
              ? "Saving..."
              : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InterestSelector;
