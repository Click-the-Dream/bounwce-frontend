import { BadgeCheck } from "lucide-react";

export default function VerifiedBadge() {
  return (
    <BadgeCheck
      className="h-4.25 w-4.25 shrink-0 fill-orange text-white"
      strokeWidth={2.2}
      aria-label="Verified"
    />
  );
}
