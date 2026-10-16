"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Loader2,
  MessageCircle,
  Users,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { useGroups } from "@/app/hooks/use-groups";
import {
  groupChatApi,
  type GroupMemberUser,
  type GroupRecord,
} from "@/app/services/group-chat";

type InviteAdmin = GroupMemberUser & {
  role?: string;
  name: string;
  avatar?: string | null;
};

const avatarUrl = (value: any) => {
  if (typeof value === "string") return value || null;
  return typeof value?.url === "string" ? value.url : null;
};

const adminFromGroup = (value: any): InviteAdmin | null => {
  const raw =
    value?.admin ??
    value?.owner ??
    value?.created_by_user ??
    value?.creator ??
    value?.createdBy ??
    null;
  const fallbackId =
    value?.admin_id ??
    value?.owner_id ??
    value?.created_by_id ??
    (typeof value?.created_by === "string" ? value.created_by : undefined);
  const source =
    raw && typeof raw === "object"
      ? raw
      : fallbackId
        ? { id: fallbackId }
        : null;
  if (!source) return null;
  const pic = source.profile_pic ?? source.avatar ?? source.avatar_url;
  const id = String(source.id ?? source.user_id ?? "");
  if (!id) return null;
  const name = String(
    source.full_name ?? source.name ?? source.username ?? "Group admin",
  );
  return {
    ...source,
    id,
    name,
    username: String(source.username ?? ""),
    avatar: avatarUrl(pic),
    role: source.role ? String(source.role) : undefined,
  } as InviteAdmin;
};

export default function GroupInvitePreview({
  groupId,
  inApp = false,
}: {
  groupId: string;
  /** Render inside the authenticated chat pane instead of as a standalone landing page. */
  inApp?: boolean;
}) {
  const router = useRouter();
  const { authDetails } = useAuth();
  const { groups } = useGroups();
  const currentUserId = String(authDetails?.user?.id ?? "");
  const [group, setGroup] = useState<GroupRecord | null>(null);
  const [admin, setAdmin] = useState<InviteAdmin | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requestError, setRequestError] = useState("");

  const isMember = useMemo(
    () => groups.some((item) => String(item.id) === String(groupId)),
    [groups, groupId],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    groupChatApi
      .getGroup(groupId)
      .then((result) => {
        if (cancelled) return;
        setGroup(result);
        setAdmin(adminFromGroup(result));
      })
      .catch((err: any) => {
        if (!cancelled) {
          setError(
            err?.response?.data?.message ??
              err?.message ??
              "This group’s details are unavailable. It may be private or no longer available.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [groupId]);

  const requestToJoin = () => {
    setRequestError("");
    if (!admin?.id) {
      setRequestError(
        "The group details do not include an admin contact. Please ask a group member to invite you.",
      );
      return;
    }
    const message = `Hi ${admin.name}, I found “${group?.name ?? "your group"}” on Bouwnce. I’d like to request access. Could you please review my request?`;
    const chatPath = `/app/chat/${encodeURIComponent(admin.id)}?groupRequestMessage=${encodeURIComponent(message)}&groupRequestId=${encodeURIComponent(groupId)}`;
    if (!currentUserId) {
      router.push(`/login?redirect=${encodeURIComponent(chatPath)}`);
      return;
    }
    router.push(chatPath);
  };

  const shellClass = inApp
    ? "flex min-h-0 flex-1 flex-col items-center justify-start overflow-y-auto bg-[#fafafa] px-4 py-6 sm:px-6 sm:py-8"
    : "min-h-[calc(100vh-2rem)] bg-gradient-to-b from-orange/[0.07] via-white to-white px-4 py-10 sm:py-16";

  if (loading) {
    return (
      <main
        className={`${shellClass} ${inApp ? "justify-center" : "items-center justify-center"}`}
      >
        <Loader2
          className="size-7 animate-spin text-orange"
          aria-label="Loading group information"
        />
      </main>
    );
  }

  if (!group || error) {
    return (
      <main
        className={`${shellClass} ${inApp ? "justify-center" : "items-center justify-center"}`}
      >
        <section className="mx-auto flex max-w-lg flex-col items-center rounded-3xl border border-gray-200 bg-white p-7 text-center shadow-sm">
          <div className="mb-4 rounded-2xl bg-orange/10 p-4 text-orange">
            <AlertTriangle size={27} />
          </div>
          <h1 className="text-xl font-semibold text-gray-900">
            Group information unavailable
          </h1>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            {error || "This group could not be found."}
          </p>
          {!inApp && (
            <Link
              href="/"
              className="mt-5 rounded-full bg-orange px-5 py-2.5 text-sm font-semibold text-white"
            >
              Go to Bouwnce
            </Link>
          )}
        </section>
      </main>
    );
  }

  const memberCount = Number(group.member_count ?? 0);
  const groupImage = group.avatar_url ?? group.icon_url;

  return (
    <main className={shellClass}>
      <section
        className={`mx-auto w-full max-w-xl overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl shadow-gray-900/5 ${inApp ? "my-auto shrink-0" : ""}`}
      >
        <div className="bg-linear-to-br from-orange/10 via-orange/4 to-sky-50 px-6 py-8 text-center sm:px-10">
          <div className="mx-auto flex size-20 items-center justify-center overflow-hidden rounded-2xl border border-white bg-white text-orange shadow-sm">
            {groupImage ? (
              <img
                src={String(groupImage)}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              <Users size={34} />
            )}
          </div>
          <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-violet-700">
            <Users size={12} /> Group information
          </p>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            {group.name}
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            {memberCount} {memberCount === 1 ? "member" : "members"} on Bouwnce
          </p>
          {group.description && (
            <p className="mx-auto mt-4 max-w-md whitespace-pre-line text-sm leading-6 text-gray-600">
              {group.description}
            </p>
          )}
        </div>
        <div className="space-y-5 px-6 py-6 sm:px-10 sm:py-8">
          {admin && (
            <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-orange/10 font-semibold text-orange">
                {admin.avatar ? (
                  <img
                    src={admin.avatar}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  admin.name.slice(0, 1).toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                  Group {admin.role === "owner" ? "owner" : "admin"}
                </p>
                <p className="truncate text-sm font-semibold text-gray-900">
                  {admin.name}
                </p>
                {admin.username && (
                  <p className="truncate text-xs text-gray-500">
                    @{admin.username}
                  </p>
                )}
              </div>
              <ShieldCheck size={19} className="shrink-0 text-emerald-600" />
            </div>
          )}
          {isMember ? (
            <button
              type="button"
              onClick={() =>
                router.push(`/app/chat?groupId=${encodeURIComponent(groupId)}`)
              }
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange/90"
            >
              Open group chat <ArrowRight size={17} />
            </button>
          ) : (
            <button
              type="button"
              onClick={requestToJoin}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange/90"
            >
              <MessageCircle size={17} /> Message admin to request access{" "}
              <ArrowRight size={17} />
            </button>
          )}
          {requestError && (
            <p role="alert" className="text-center text-sm text-red-600">
              {requestError}
            </p>
          )}
          <p className="text-center text-xs leading-5 text-gray-400">
            {isMember
              ? "You already belong to this group."
              : "Membership is controlled by the group admin. Your message is prepared as a draft; it is not sent automatically."}
          </p>
        </div>
      </section>
      {!inApp && (
        <p className="mt-6 text-center text-xs text-gray-400">
          Powered by Bouwnce · Find your people. Get what you need.
        </p>
      )}
    </main>
  );
}
