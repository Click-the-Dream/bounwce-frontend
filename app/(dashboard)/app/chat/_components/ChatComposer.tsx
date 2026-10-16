"use client";

import type { ReactNode, KeyboardEvent, RefObject } from "react";
import { ArrowUp, Loader2 } from "lucide-react";

/** Shared visual composer row for direct and group conversations. */
export interface ChatComposerProps {
  value: string;
  onChange: (value: string, element: HTMLTextAreaElement) => void;
  onSend: () => void | Promise<void>;
  placeholder?: string;
  inputId?: string;
  inputRef?: RefObject<HTMLTextAreaElement | null>;
  leading?: ReactNode;
  children?: ReactNode;
  canSend?: boolean;
  disabled?: boolean;
  isSending?: boolean;
  sendButtonVisible?: boolean;
  onKeyDown?: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  ariaLabel?: string;
  wrapperClassName?: string;
}

export default function ChatComposer({
  value,
  onChange,
  onSend,
  placeholder = "Message",
  inputId,
  inputRef,
  leading,
  children,
  canSend = Boolean(value.trim()),
  disabled = false,
  isSending = false,
  sendButtonVisible = true,
  onKeyDown,
  onFocus,
  onBlur,
  ariaLabel = "Message input",
  wrapperClassName = "relative w-full",
}: ChatComposerProps) {
  const resize = (element: HTMLTextAreaElement) => {
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 112)}px`;
  };

  return (
    <div className={wrapperClassName}>
      {children}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!disabled && canSend) void onSend();
        }}
        className="w-full"
      >
        <div className="flex items-end gap-3 rounded-[30px] border-[0.5px] border-orange bg-[#EFF3F4] px-2.5 py-2 shadow-sm">
          {leading}
          <textarea
            ref={inputRef}
            id={inputId}
            rows={1}
            value={value}
            disabled={disabled}
            maxLength={4000}
            onChange={(event) => {
              onChange(event.currentTarget.value, event.currentTarget);
              resize(event.currentTarget);
            }}
            onFocus={onFocus}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            aria-label={ariaLabel}
            className="max-h-28 min-h-7 flex-1 resize-none overflow-x-hidden overflow-y-auto py-1 text-sm leading-5 text-gray-900 outline-none placeholder:text-gray-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          />
          {sendButtonVisible && (
            <button
              type="submit"
              disabled={disabled || !canSend}
              aria-label="Send message"
              className="w-7.5 h-7.5 flex items-center justify-center bg-orange text-white rounded-full transition-all active:scale-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSending ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <ArrowUp size={19} strokeWidth={2.4} />
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
