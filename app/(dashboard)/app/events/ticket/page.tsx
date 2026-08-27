"use client";

import { useRouter } from "next/navigation";
import TicketVerification from "./_components/TicketVerification";

export default function TicketVerificationPage() {
  const router = useRouter();

  const handleConfirm = (ticketRef: string) => {
    console.log("Verify ticket", ticketRef);
  };

  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] w-full items-center justify-center bg-[#ECECF080] px-4 py-8">
      <TicketVerification
        mode="page"
        onConfirm={handleConfirm}
        onCancel={() => router.back()}
      />
    </main>
  );
}
