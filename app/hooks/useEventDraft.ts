import { useEffect, useState } from "react";
import { FieldValues, UseFormReset, UseFormWatch } from "react-hook-form";
import { isEmptyDraft } from "@/app/_utils/formatters";

const EVENT_DRAFT_KEY = "create_event_draft";

export function useEventDraft<T extends FieldValues>({
  watch,
  reset,
  storageKey = EVENT_DRAFT_KEY,
}: {
  watch: UseFormWatch<T>;
  reset: UseFormReset<T>;
  storageKey?: string;
}) {
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [savedDraft, setSavedDraft] = useState<T | null>(null);
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);

  // Check existing draft
  useEffect(() => {
    const draft = localStorage.getItem(storageKey);

    if (draft) {
      const parsedDraft = JSON.parse(draft);

      if (!isEmptyDraft(parsedDraft)) {
        setSavedDraft(parsedDraft);
        setShowDraftModal(true);
        return;
      }

      localStorage.removeItem(storageKey);
    }

    setIsDraftLoaded(true);
  }, [storageKey]);

  // Save draft
  useEffect(() => {
    if (!isDraftLoaded) return;

    const subscription = watch((values) => {
      const draft = {
        ...values,
        banner: null,
      };

      if (isEmptyDraft(draft)) {
        localStorage.removeItem(storageKey);
        return;
      }

      localStorage.setItem(storageKey, JSON.stringify(draft));
    });

    return () => subscription.unsubscribe();
  }, [watch, isDraftLoaded, storageKey]);

  const continueDraft = () => {
    if (savedDraft) {
      reset(savedDraft);
    }

    setShowDraftModal(false);
    setIsDraftLoaded(true);
  };

  const startNew = () => {
    localStorage.removeItem(storageKey);

    setSavedDraft(null);
    setShowDraftModal(false);
    setIsDraftLoaded(true);
  };

  const clearDraft = () => {
    localStorage.removeItem(storageKey);
  };

  return {
    showDraftModal,
    savedDraft,
    continueDraft,
    startNew,
    clearDraft,
  };
}
