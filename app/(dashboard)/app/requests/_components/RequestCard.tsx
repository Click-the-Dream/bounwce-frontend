"use client";

import { avatarColor, STATUS_CONFIG, timeAgo } from "@/app/_utils/formatters";
import { slugify } from "@/app/_utils/slugify";
import {
  ConnectionRequest,
  RequestStatus,
} from "@/app/_utils/types/connection";
import { getInitials } from "@/app/_utils/utility";
import { useAuth } from "@/app/context/AuthContext";
import { Check, Clock, Link2, Loader2, UserCheck, X } from "lucide-react";
import { useRouter } from "next/navigation";
import UserImage from "../../_components/UserImage";

const RequestCard = ({
  r,
  actionLoading,
  onAccept,
  onReject,
}: {
  r: ConnectionRequest;
  actionLoading: "accept" | "reject" | null;
  onAccept: () => void;
  onReject: () => void;
}) => {
  const { authDetails } = useAuth();
  const router = useRouter();
  // Access the user ID from the auth context
  const currentUserId = authDetails?.user?.id;

  const normalizeStatus = (status: RequestStatus) =>
    status === "expired" ? "rejected" : status;

  const normalized = normalizeStatus(r.status);
  const statusCfg = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.pending;
  const isActing = !!actionLoading;

  // Logic: Am I the recipient?
  const isRecipient = r.target_user.id === currentUserId;

  const goToProfile = () => {
    router.push(
      `/app/profile/${slugify(r.requester.full_name)}_${r.requester.id}`,
    );
  };

  return (
    <div className="group flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm transition-all duration-150">
      {/* Avatar */}

      <UserImage user={r.requester} rounded="rounded-full" size={40} />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="cursor-pointer flex items-center gap-2 flex-wrap">
          {/* If I am the recipient, show the Requester's name. If I am the requester, show the Target's name. */}
          <span
            onClick={goToProfile}
            className="hover:underline text-sm font-semibold text-slate-800 truncate"
          >
            {isRecipient ? r.requester.full_name : r.target_user.full_name}
          </span>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusCfg.pill}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
            {statusCfg.label}
          </span>
        </div>

        <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5 truncate">
          <Link2 size={10} className="shrink-0" />
          <span className="truncate">
            {isRecipient
              ? "sent you a connection request"
              : `you requested to connect with ${r.target_user.full_name}`}
          </span>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1">
          <Clock size={10} className="shrink-0" />
          {timeAgo(r.created_at)}
        </div>
      </div>

      {/* Actions Logic */}
      <div className="flex items-center gap-2 shrink-0">
        {normalized === "pending" ? (
          isRecipient ? (
            // I am the target, I can act
            <>
              <button
                onClick={onAccept}
                disabled={isActing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 transition-colors"
              >
                {actionLoading === "accept" ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Check size={13} />
                )}
                Accept
              </button>
              <button
                onClick={onReject}
                disabled={isActing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors"
              >
                {actionLoading === "reject" ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <X size={13} />
                )}
                Reject
              </button>
            </>
          ) : (
            // I am the requester, I must wait
            <div className="text-xs text-slate-400 italic px-3 py-1.5">
              Pending response
            </div>
          )
        ) : (
          // Request finalized
          <div
            className={`flex items-center gap-1.5 text-xs font-medium ${
              normalized === "accepted" ? "text-emerald-600" : "text-slate-400"
            }`}
          >
            <UserCheck size={14} />
            {statusCfg.label}
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestCard;
