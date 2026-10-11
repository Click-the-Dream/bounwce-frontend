"use client";

import { useRouter } from "next/navigation";
import TicketVerification from "../../ticket/_components/TicketVerification";

export default function TicketVerificationModal() {
  const router = useRouter();

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/45 px-4 py-6 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="Ticket verification"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) router.back();
      }}
    >
      <TicketVerification
        mode="modal"
        onCancel={() => router.back()}
      />
    </div>
  );
}
