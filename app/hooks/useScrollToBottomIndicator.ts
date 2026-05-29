import { useCallback, useRef, useState } from "react";

const THRESHOLD = 180;

export const useScrollToBottomIndicator = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [showButton, setShowButton] = useState(false);

  const isNearBottom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return true;

    return el.scrollHeight - el.scrollTop - el.clientHeight < THRESHOLD;
  }, []);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const nearBottom = isNearBottom();
    setShowButton(!nearBottom);
  }, [isNearBottom]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const el = containerRef.current;
    if (!el) return;

    el.scrollTo({
      top: el.scrollHeight,
      behavior,
    });
  }, []);

  return {
    containerRef,
    showButton,
    handleScroll,
    scrollToBottom,
  };
};
