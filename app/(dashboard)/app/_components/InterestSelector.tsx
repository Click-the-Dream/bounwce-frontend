"use client";

import { onFailure } from "@/app/_utils/notification";
import { useAuth } from "@/app/context/AuthContext";
import useInterest from "@/app/hooks/use-interest";
import { useEffect, useState } from "react";

interface Props {
  open?: boolean;
  onClose?: () => void;
}

const InterestSelector = ({ open: openProp, onClose }: Props) => {
  const { authDetails } = useAuth();
  const authUser = authDetails?.user;
  const [internalOpen, setInternalOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [hasHydrated, setHasHydrated] = useState(false);

  const {
    useGetAvailableInterests,
    useGetUserInterests,
    addUserInterests,
    updateUserInterests,
  } = useInterest();

  const {
    data: userInterests = [],
    isLoading: isLoadingUser,
    isError: isErrorUser,
  } = useGetUserInterests();

  const hasInterests = userInterests.length > 0;
  const {
    data: availableData,
    isLoading: isLoadingAvailable,
    isError: isErrorAvailable,
  } = useGetAvailableInterests(hasInterests);

  const safeAvailable = availableData ?? [];
  const isError = isErrorAvailable || isErrorUser;

  const [selected, setSelected] = useState<Record<string, string[]>>({});

  // ---------------- OPEN CONTROL ----------------

  const isControlled = openProp !== undefined;
  const resolvedOpen = isControlled ? openProp : internalOpen;

  const handleClose = () => {
    if (!isControlled) setInternalOpen(false);
    onClose?.();
  };

  // ---------------- INIT OPEN STATE ----------------

  useEffect(() => {
    if (!isControlled && authUser) {
      setInternalOpen(!hasInterests);
    }
  }, [hasInterests, isControlled, authUser]);

  // ---------------- BUILD INITIAL STATE ONLY ONCE ----------------

  useEffect(() => {
    if (!safeAvailable.length) return;
    if (!userInterests.length) return;
    if (hasHydrated) return;

    const initial: Record<string, string[]> = {};

    // build category map
    safeAvailable.forEach((item: any) => {
      const key = item.category?.toLowerCase().replace(/\s/g, "_");
      initial[key] = [];
    });

    // userInterests is STRING[]
    userInterests.forEach((interest: string) => {
      safeAvailable.forEach((cat: any) => {
        const key = cat.category?.toLowerCase().replace(/\s/g, "_");

        if (cat.interests.includes(interest)) {
          initial[key].push(interest);
        }
      });
    });

    setSelected(initial);
    setHasHydrated(true);
  }, [safeAvailable, userInterests, hasHydrated]);

  // ---------------- CATEGORIES ----------------

  const categories = safeAvailable.map((item: any) => ({
    id: item.category?.toLowerCase().replace(/\s/g, "_"),
    title: item.category,
    options: item.interests,
  }));

  // ---------------- TOGGLE ----------------

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

  // ---------------- SAVE ----------------

  const handleSave = async () => {
    setSubmitError(null);

    const payload = {
      interests: Object.values(selected).flat().filter(Boolean),
    };

    if (!payload.interests.length) {
      setSubmitError("Please select at least one interest.");
      return;
    }

    try {
      if (hasInterests) {
        await updateUserInterests.mutateAsync(payload as any);
      } else {
        await addUserInterests.mutateAsync(payload as any);
      }

      handleClose();
    } catch (err: any) {
      onFailure({
        title: "Save failed",
        message:
          err?.response?.data?.message ||
          "We couldn't save your interests. Please try again.",
      });
    }
  };

  // ---------------- LOADING / ERRORS ----------------

  if (isLoadingUser) return null;

  if (!hasInterests && isLoadingAvailable) {
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

  if (isError) return null;

  if (!resolvedOpen) return null;

  // ---------------- UI ----------------

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-gray-200/80 backdrop-blur-sm p-4 font-sans">
      <div className="bg-white rounded-2xl shadow-xl max-w-294.75 w-full max-h-[95vh] overflow-y-auto p-8.5 relative">
        <header className="mb-7.25 text-center text-black">
          <h1 className="text-[20px] font-semibold mb-2.25">
            Browse Your Interest
          </h1>
          <p className="text-sm max-w-md mx-auto">
            Select at least 1 interest in each category
          </p>
        </header>

        {submitError && (
          <div className="mb-4 text-sm text-red-500 text-center">
            {submitError}
          </div>
        )}

        <div className="space-y-9.5">
          {categories.map((category: any) => (
            <section key={category.id} className="text-center">
              <h2 className="text-sm font-semibold mb-5">{category.title}</h2>

              <div className="flex flex-wrap justify-center gap-3">
                {category.options.map((option: string) => {
                  const isSelected = selected?.[category.id]?.includes(option);

                  return (
                    <button
                      key={option}
                      onClick={() => toggleInterest(category.id, option)}
                      className={`px-5 py-2.5 text-sm border-2 transition-all ${
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

        <div className="mt-16 flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="bg-gray-200 text-gray-700 py-2.5 px-7.5 rounded-lg"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={
              addUserInterests.isPending || updateUserInterests.isPending
            }
            className="bg-orange text-white py-2.5 px-7.5 rounded-lg disabled:opacity-50"
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
