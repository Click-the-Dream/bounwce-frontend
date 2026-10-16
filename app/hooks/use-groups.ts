"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CreateGroupInput,
  GroupMember,
  GroupRecord,
  groupChatApi,
} from "@/app/services/group-chat";

export const groupKeys = {
  all: ["group-conversations"] as const,
  detail: (groupId: string) => ["group-conversation", groupId] as const,
  members: (groupId: string) => ["group-members", groupId] as const,
};

export function useGroups(enabled = true) {
  const queryClient = useQueryClient();

  const groupsQuery = useQuery({
    queryKey: groupKeys.all,
    queryFn: groupChatApi.listGroups,
    enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const createGroup = useMutation({
    mutationFn: (input: CreateGroupInput) => groupChatApi.createGroup(input),
    onSuccess: async (group) => {
      queryClient.setQueryData<GroupRecord[]>(groupKeys.all, (old = []) => {
        const exists = old.some((item) => String(item.id) === String(group.id));
        return exists ? old.map((item) => String(item.id) === String(group.id) ? { ...item, ...group } : item) : [group, ...old];
      });
      await queryClient.invalidateQueries({ queryKey: groupKeys.all });
    },
  });

  const updateGroup = useMutation({
    mutationFn: ({ groupId, input }: { groupId: string; input: Partial<Pick<GroupRecord, "name" | "description" | "avatar_url">> }) =>
      groupChatApi.updateGroup(groupId, input),
    onSuccess: async (group, variables) => {
      queryClient.setQueryData(groupKeys.detail(variables.groupId), group);
      queryClient.setQueryData<GroupRecord[]>(groupKeys.all, (old = []) =>
        old.map((item) => String(item.id) === String(variables.groupId)
          ? { ...item, ...group, id: String(group.id || item.id) }
          : item),
      );
      await queryClient.invalidateQueries({ queryKey: groupKeys.all });
    },
  });

  const deleteGroup = useMutation({
    mutationFn: (groupId: string) => groupChatApi.deleteGroup(groupId),
    onSuccess: async (_result, groupId) => {
      queryClient.setQueryData<GroupRecord[]>(groupKeys.all, (old = []) => old.filter((group) => String(group.id) !== String(groupId)));
      queryClient.removeQueries({ queryKey: groupKeys.detail(groupId) });
      queryClient.removeQueries({ queryKey: ["group-messages", groupId] });
      queryClient.removeQueries({ queryKey: ["group-message-pages", groupId] });
      await queryClient.invalidateQueries({ queryKey: groupKeys.all });
    },
  });

  return {
    groups: groupsQuery.data ?? [],
    isLoading: groupsQuery.isLoading,
    isError: groupsQuery.isError,
    error: groupsQuery.error,
    refetch: groupsQuery.refetch,
    createGroup,
    updateGroup,
    deleteGroup,
  };
}

export function useGroupMembers(groupId?: string, enabled = true) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: groupId ? groupKeys.members(groupId) : ["group-members", "disabled"],
    queryFn: () => groupChatApi.listMembers(groupId as string),
    enabled: Boolean(groupId && enabled),
    staleTime: 30_000,
  });

  const addMember = useMutation({
    mutationFn: ({ userId }: { userId: string }) => {
      if (!groupId) throw new Error("Select a group first.");
      return groupChatApi.addMember(groupId, userId);
    },
    onSuccess: async () => {
      if (!groupId) return;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: groupKeys.members(groupId) }),
        queryClient.invalidateQueries({ queryKey: groupKeys.all }),
        queryClient.invalidateQueries({ queryKey: groupKeys.detail(groupId) }),
      ]);
    },
  });

  const removeMember = useMutation({
    mutationFn: ({ userId }: { userId: string }) => {
      if (!groupId) throw new Error("Select a group first.");
      return groupChatApi.removeMember(groupId, userId);
    },
    onSuccess: async (_result, variables) => {
      if (!groupId) return;
      queryClient.setQueryData<GroupMember[]>(groupKeys.members(groupId), (old = []) => old.filter((member) => String(member.user_id ?? member.user?.id ?? (!member.user ? member.id : "")) !== String(variables.userId)));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: groupKeys.members(groupId) }),
        queryClient.invalidateQueries({ queryKey: groupKeys.all }),
      ]);
    },
  });

  return {
    members: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    addMember,
    removeMember,
  };
}
