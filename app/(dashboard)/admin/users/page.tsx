"use client";

import { useMemo, useState } from "react";

import Card from "../_components/Card";
import CardHeader from "../_components/CardHeader";
import SearchBar from "../_components/SearchBar";
import TabRow from "../_components/TableRow";
import TableShell from "../_components/TableShell";
import Avatar from "../_components/Avatar";
import StatusBadge from "../_components/StatusBadge";
import IconBtn from "../_components/IconButton";

import { Eye, Lock, Pencil, Plus, Trash2, Unlock } from "lucide-react";

import { formatCurrency, formatDate } from "@/app/_utils/utility";

import useUser from "@/app/hooks/use-user";
import { User } from "@/app/_utils/types/buyer";

export default function UsersPage() {
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");

  const { useGetUsers } = useUser();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useGetUsers({
    page_size: 20,
  });

  const users = data?.pages.flatMap((page) => page.users || []) || [];

  const filtered = useMemo(() => {
    return users.filter((u: User) => {
      const status = u?.is_active ? "active" : "pending";

      const matchTab = tab === "all" || status === tab;

      const matchSearch =
        !search ||
        u?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        u?.email?.toLowerCase().includes(search.toLowerCase());

      return matchTab && matchSearch;
    });
  }, [users, tab, search]);

  const tabs = [
    {
      key: "all",
      label: "All",
      count: data?.pages[0]?.total,
    },
    {
      key: "active",
      label: "Active",
      count: users.filter((u: User) => u?.is_active).length,
    },
    {
      key: "pending",
      label: "Pending",
      count: users.filter((u: User) => !u?.is_active).length,
    },
  ];

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-400">Loading users...</div>
    );
  }

  if (isError) {
    return (
      <div className="p-12 text-center text-red-500">Failed to load users.</div>
    );
  }

  return (
    <Card className="max-h-[calc(100vh-120px)] overflow-hidden flex flex-col">
      <CardHeader>
        <div>
          <h3 className="font-semibold text-slate-800">Users</h3>

          <p className="text-xs text-slate-400 mt-0.5">
            {data?.pages[0]?.total} results
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search users…"
          />

          <TabRow tabs={tabs} active={tab} onChange={setTab} />

          <button className="cursor-pointer  h-7.5 flex-1 border border-[#F4F4F4] outline-[0.83px] p-2 rounded-lg text-xs font-medium flex items-center justify-center transition-all bg-orange text-white hover:bg-[#ee3d15]">
            <Plus fill="#8a0202" className="size-4 mr-1.75" />
            Add user
          </button>
        </div>
      </CardHeader>

      <div className="flex-1 overflow-auto">
        <TableShell
          headers={[
            "User",
            "Role",
            "Status",
            "Orders",
            "Total spent",
            "Joined",
            "Actions",
          ]}
        >
          {filtered.map((u: User) => (
            <tr
              key={u?.id}
              className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors"
            >
              <td className="px-4 py-3.5 pl-6">
                <div className="flex items-center gap-2.5 min-w-60">
                  <Avatar
                    initials={u?.full_name?.slice(0, 2)}
                    src={u?.profile_pic?.url}
                  />

                  <div>
                    <div className="font-medium text-slate-800">
                      {u?.full_name}
                    </div>

                    <div className="text-xs text-slate-400">{u?.email}</div>
                  </div>
                </div>
              </td>

              <td className="px-4 py-3.5 text-slate-500 text-xs whitespace-nowrap">
                {u?.role || "User"}
              </td>

              <td className="px-4 py-3.5 whitespace-nowrap">
                <StatusBadge status={u?.is_active ? "Active" : "Pending"} />
              </td>

              <td className="px-4 py-3.5 text-slate-600 text-sm whitespace-nowrap">
                {0}
              </td>

              <td className="px-4 py-3.5 font-medium text-slate-800 text-sm whitespace-nowrap"></td>

              <td className="px-4 py-3.5 text-slate-400 text-xs whitespace-nowrap">
                {u?.created_at ? formatDate(u?.created_at) : "—"}
              </td>

              <td className="px-4 py-3.5 pr-6">
                <div className="flex items-center gap-1.5">
                  <IconBtn icon={Eye} label="View" />

                  <IconBtn icon={Pencil} label="Edit" />

                  {u?.is_active ? (
                    <IconBtn icon={Lock} label="Suspend" />
                  ) : (
                    <IconBtn icon={Unlock} label="Restore" />
                  )}

                  <IconBtn icon={Trash2} label="Delete" danger />
                </div>
              </td>
            </tr>
          ))}
        </TableShell>

        {filtered.length === 0 && (
          <div className="py-16 text-center text-slate-400 text-sm">
            No users match your filter.
          </div>
        )}

        {hasNextPage && (
          <div className="p-4 border-t border-slate-100 text-center">
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="text-sm font-medium text-violet-600 hover:text-violet-800"
            >
              {isFetchingNextPage ? "Loading..." : "Load more users"}
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}
