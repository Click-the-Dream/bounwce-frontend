import api from "@/app/services/api";

export type GroupMediaType = "image" | "video" | "file" | "audio" | null;

export interface GroupMember {
  id?: string;
  user_id?: string;
  username?: string | null;
  full_name?: string | null;
  profile_pic?: { url?: string } | string | null;
  role?: string | null;
  joined_at?: string | null;
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
  mentioned_user_ids?: string[] | null;
  read_count?: number;
  sender?: GroupMember | null;
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
  const candidates = root?.members?.items ?? root?.members ?? root?.items ?? root?.data?.members;
  return Array.isArray(candidates) ? candidates : [];
}

export function normalizeGroupMessages(response: any): GroupMessageRecord[] {
  const root = unwrap(response);
  const candidates = root?.items ?? root?.messages?.items ?? root?.messages ?? root?.data?.items ?? root?.data?.messages;
  return Array.isArray(candidates) ? candidates : Array.isArray(root) ? root : [];
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
  async listMessages(groupId: string): Promise<GroupMessageRecord[]> {
    const response = await api.get(`/groups/${encodeURIComponent(groupId)}/messages`);
    return normalizeGroupMessages(response.data);
  },
};
