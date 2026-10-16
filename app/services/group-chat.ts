import api from "@/app/services/api";

export type GroupMediaType = "image" | "video" | "file" | "audio" | null;

export interface GroupMemberUser {
  id: string;
  username?: string | null;
  full_name?: string | null;
  email?: string | null;
  profile_pic?: { url?: string } | string | null;
  [key: string]: unknown;
}

/**
 * Group members endpoint returns membership records, not bare user records.
 * `id` is the membership ID; `user_id` and `user.id` identify the person.
 */
export interface GroupMember {
  id?: string;
  group_id?: string;
  user_id?: string;
  user?: GroupMemberUser | null;
  username?: string | null;
  full_name?: string | null;
  email?: string | null;
  profile_pic?: { url?: string } | string | null;
  role?: string | null;
  joined_at?: string | null;
  invited_by?: string | null;
  is_active?: boolean;
  online?: boolean;
  [key: string]: unknown;
}

export interface GroupRecord {
  id: string;
  name: string;
  description?: string | null;
  avatar_url?: string | null;
  icon_url?: string | null;
  member_count?: number;
  members?: GroupMember[];
  created_at?: string;
  updated_at?: string;
  last_message?: {
    id?: string;
    body?: string | null;
    sender_id?: string;
    created_at?: string;
    media_type?: GroupMediaType;
  } | null;
  unread_count?: number;
  [key: string]: unknown;
}

export interface CreateGroupInput {
  name: string;
  description?: string;
  member_ids?: string[];
}

export interface GroupMessagesPage {
  items: GroupMessageRecord[];
  page: number;
  page_size: number;
  total: number;
  has_more?: boolean;
  next_page?: number | null;
  total_pages?: number;
  [key: string]: unknown;
}

export interface GroupMessageRecord {
  id: string;
  group_id: string;
  sender_id: string;
  body: string | null;
  created_at: string;
  updated_at?: string;
  edited_at?: string | null;
  is_edited?: boolean;
  media_type?: GroupMediaType;
  media_urls?: string[] | null;
  media_names?: string[] | null;
  reply_to_message_id?: string | null;
  /** Some history responses expand the referenced message; others return only its ID. */
  reply_to_message?: GroupMessageRecord | false | null;
  mentioned_user_ids?: string[] | null;
  read_count?: number;
  sender?: GroupMemberUser | null;
  [key: string]: unknown;
}

const unwrap = (response: any) => response?.data?.data ?? response?.data ?? response;

function normalizeGroupRecord(value: any): GroupRecord {
  const raw = value?.group ?? value?.item ?? value?.data?.group ?? value?.data ?? value ?? {};
  const id = raw?.id ?? raw?.group_id ?? raw?.uuid;
  return {
    ...raw,
    id: id == null ? "" : String(id),
    name: String(raw?.name ?? raw?.title ?? "Group chat"),
    member_count: Number(raw?.member_count ?? raw?.members_count ?? raw?.total_members ?? raw?.members?.length ?? 0),
  } as GroupRecord;
}

export function normalizeGroups(response: any): GroupRecord[] {
  const root = unwrap(response);
  const candidates = root?.items ?? root?.groups?.items ?? root?.groups ?? root?.data?.items ?? root?.data?.groups;
  const records = Array.isArray(candidates) ? candidates : Array.isArray(root) ? root : [];
  return records.map(normalizeGroupRecord).filter((group) => Boolean(group.id));
}

export function normalizeGroupMembers(response: any): GroupMember[] {
  const root = unwrap(response);
  const candidates = Array.isArray(root)
    ? root
    : root?.members?.items ?? root?.members ?? root?.items ?? root?.data?.members ?? root?.data?.items;

  if (!Array.isArray(candidates)) return [];

  return candidates.map((value: any) => {
    const user = value?.user && typeof value.user === "object" ? value.user : null;
    const userId = value?.user_id ?? user?.id ?? (!user ? value?.id : undefined);
    return {
      ...value,
      ...(user ? { user: { ...user, id: String(user.id ?? userId ?? "") } } : {}),
      ...(userId != null ? { user_id: String(userId) } : {}),
      ...(value?.is_active !== undefined ? { is_active: Boolean(value.is_active) } : {}),
    } as GroupMember;
  }).filter((member: GroupMember) => Boolean(member.user_id ?? member.user?.id ?? member.id));
}

export function normalizeGroupMessages(response: any): GroupMessageRecord[] {
  const root = unwrap(response);
  const candidates = Array.isArray(root)
    ? root
    : root?.items ?? root?.messages?.items ?? root?.messages ?? root?.data?.items ?? root?.data?.messages;
  return Array.isArray(candidates) ? candidates : [];
}

export function normalizeGroupMessagesPage(
  response: any,
  fallback: { page?: number; page_size?: number } = {},
): GroupMessagesPage {
  const root = unwrap(response);
  const nested = root?.messages && !Array.isArray(root.messages) ? root.messages : root;
  const metadata = nested?.pagination ?? nested?.meta ?? root?.pagination ?? root?.meta ?? {};
  const items = normalizeGroupMessages(root).map((message: any) => ({
    ...message,
    id: String(message?.id ?? message?.message_id ?? ""),
    group_id: String(message?.group_id ?? ""),
    sender_id: String(message?.sender_id ?? message?.user_id ?? ""),
  })).filter((message: GroupMessageRecord) => Boolean(message.id));

  const page = Number(metadata.page ?? nested?.page ?? root?.page ?? fallback.page ?? 1);
  const pageSize = Number(metadata.page_size ?? metadata.per_page ?? nested?.page_size ?? nested?.per_page ?? root?.page_size ?? fallback.page_size ?? 20);
  const totalValue = metadata.total ?? metadata.total_items ?? nested?.total ?? nested?.total_items ?? root?.total ?? root?.total_items;
  const totalPagesValue = metadata.total_pages ?? metadata.last_page ?? nested?.total_pages ?? nested?.last_page ?? root?.total_pages;
  const totalPages = totalPagesValue == null ? undefined : Number(totalPagesValue);
  const explicitHasMore = metadata.has_more ?? metadata.has_next ?? nested?.has_more ?? nested?.has_next ?? root?.has_more ?? root?.has_next;
  const nextPageValue = metadata.next_page ?? metadata.next ?? nested?.next_page ?? nested?.next ?? root?.next_page;
  const parsedNextPage = nextPageValue == null || typeof nextPageValue === "boolean" ? NaN : Number(nextPageValue);
  const nextPage = Number.isFinite(parsedNextPage) && parsedNextPage > page ? parsedNextPage : null;
  const hasNextLink = typeof nextPageValue === "string" && nextPageValue.trim().length > 0;
  const hasPaginationMetadata = [
    metadata.total, metadata.total_items, nested?.total, nested?.total_items, root?.total, root?.total_items,
    metadata.total_pages, metadata.last_page, nested?.total_pages, nested?.last_page, root?.total_pages,
    metadata.has_more, metadata.has_next, nested?.has_more, nested?.has_next, root?.has_more, root?.has_next,
    metadata.next_page, metadata.next, nested?.next_page, nested?.next, root?.next_page,
  ].some((value) => value !== undefined && value !== null);
  const total = totalValue == null ? items.length : Number(totalValue);
  const safePageSize = Number.isFinite(pageSize) && pageSize > 0 ? pageSize : (fallback.page_size ?? 20);
  const hasMore = typeof explicitHasMore === "boolean"
    ? explicitHasMore
    : nextPageValue === true || hasNextLink
      ? true
      : nextPage != null
        ? nextPage > page
        : totalPages != null
        ? page < totalPages
          : hasPaginationMetadata
            ? page * safePageSize < total
            : items.length >= safePageSize;

  return {
    ...(nested && typeof nested === "object" && !Array.isArray(nested) ? nested : {}),
    items,
    page: Number.isFinite(page) && page > 0 ? page : (fallback.page ?? 1),
    page_size: safePageSize,
    total: Number.isFinite(total) && total >= 0 ? total : items.length,
    has_more: hasMore,
    next_page: nextPage,
    ...(totalPages != null && Number.isFinite(totalPages) ? { total_pages: totalPages } : {}),
  };
}

/** REST operations for group metadata, membership and history. */
export const groupChatApi = {
  async listGroups(): Promise<GroupRecord[]> {
    const response = await api.get("/groups");
    return normalizeGroups(response.data);
  },
  async getGroup(groupId: string): Promise<GroupRecord> {
    const response = await api.get(`/groups/${encodeURIComponent(groupId)}`);
    return normalizeGroupRecord(unwrap(response.data));
  },
  async createGroup(input: CreateGroupInput): Promise<GroupRecord> {
    const response = await api.post("/groups", {
      name: input.name.trim(),
      ...(input.description?.trim() ? { description: input.description.trim() } : {}),
      ...(input.member_ids?.length ? { member_ids: [...new Set(input.member_ids)] } : {}),
    });
    const created = normalizeGroupRecord(unwrap(response.data));
    if (!created.id) throw new Error("The create-group response did not include a group ID.");

    // Some group APIs accept initial members in the create payload while others
    // expose member addition only through the members endpoint. Reconcile the
    // selected members so this flow supports either response convention.
    if (input.member_ids?.length) {
      let existingIds = new Set<string>();
      try {
        const currentMembers = await groupChatApi.listMembers(created.id);
        existingIds = new Set(currentMembers.map((member) => String(member.user_id ?? member.id ?? "")));
      } catch {
        // If the membership read is temporarily unavailable, attempt the add
        // calls below; the server remains authoritative about duplicates.
      }
      for (const userId of [...new Set(input.member_ids)]) {
        if (existingIds.has(String(userId))) continue;
        try {
          await groupChatApi.addMember(created.id, userId);
        } catch (error: any) {
          if (error?.response?.status !== 409) throw error;
        }
      }
    }
    return created;
  },
  async updateGroup(groupId: string, input: Partial<Pick<GroupRecord, "name" | "description" | "avatar_url">>): Promise<GroupRecord> {
    const response = await api.patch(`/groups/${encodeURIComponent(groupId)}`, input);
    return normalizeGroupRecord(unwrap(response.data));
  },
  async deleteGroup(groupId: string): Promise<void> {
    await api.delete(`/groups/${encodeURIComponent(groupId)}`);
  },
  async listMembers(groupId: string): Promise<GroupMember[]> {
    const response = await api.get(`/groups/${encodeURIComponent(groupId)}/members`);
    return normalizeGroupMembers(response.data);
  },
  async addMember(groupId: string, userId: string): Promise<unknown> {
    const response = await api.post(`/groups/${encodeURIComponent(groupId)}/members`, { user_id: userId });
    return unwrap(response.data);
  },
  async removeMember(groupId: string, userId: string): Promise<void> {
    await api.delete(`/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(userId)}`);
  },
  async listMessages(
    groupId: string,
    page = 1,
    pageSize = 20,
  ): Promise<GroupMessagesPage> {
    const response = await api.get(`/groups/${encodeURIComponent(groupId)}/messages`, {
      params: { page, page_size: pageSize },
    });
    return normalizeGroupMessagesPage(response.data, { page, page_size: pageSize });
  },
};
