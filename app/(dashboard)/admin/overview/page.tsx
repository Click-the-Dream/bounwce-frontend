"use client";
import { ORDERS, VENDORS } from "@/app/_utils/mock";
import MetricCard from "../_components/MetricCard";
import {
  Check,
  Download,
  MapPin,
  Receipt,
  Store,
  Users,
  X,
} from "lucide-react";
import CardHeader from "../_components/CardHeader";
import Card from "../_components/Card";
import TableShell from "../_components/TableShell";
import Avatar from "../_components/Avatar";
import StatusBadge from "../_components/StatusBadge";
import { formatCurrency, formatDate } from "@/app/_utils/utility";
import { Order, Vendor } from "@/app/_utils/types/admin";
import useUser from "@/app/hooks/use-user";
import { User } from "@/app/_utils/types/buyer";
import { useRouter } from "next/navigation";

export default function OverviewPage() {
  const { useGetUsers } = useUser();
  const router = useRouter();

  const { data, isLoading, isError } = useGetUsers({ page_size: 5 });

  // Flatten the pages for the table
  const recentUsers = data?.pages.flatMap((page) => page.users) || [];

  const pendingVendors = VENDORS.filter((v) => v.status === "pending");
  const recentOrders = ORDERS.slice(0, 5);

  if (isLoading)
    return (
      <div className="p-12 text-center text-slate-400">
        Loading dashboard...
      </div>
    );
  if (isError)
    return (
      <div className="p-12 text-center text-red-500">Error loading data.</div>
    );

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Users"
          // Dynamic value injected here
          value={data?.pages[0]?.total || 0}
          delta={12}
          icon={Users}
          iconColor="bg-violet-50 text-violet-600"
        />
        <MetricCard
          label="Active Vendors"
          value="312"
          delta={5}
          icon={Store}
          iconColor="bg-emerald-50 text-emerald-600"
        />
        <MetricCard
          label="Stores Listed"
          value="1,047"
          delta={8}
          icon={MapPin}
          iconColor="bg-sky-50 text-sky-600"
        />
        <MetricCard
          label="Orders Today"
          value="186"
          delta={-3}
          icon={Receipt}
          iconColor="bg-amber-50 text-amber-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-slate-800">Recent users</h3>
          </CardHeader>

          <TableShell headers={["User", "Role", "Status", "Joined"]}>
            {recentUsers?.slice(0, 5)?.map((u: User) => (
              <tr
                key={u?.id}
                className="border-b border-slate-50 hover:bg-slate-50/60"
              >
                <td className="px-4 py-3 pl-6">
                  <div className="flex items-center gap-2.5">
                    <Avatar
                      initials={u?.full_name?.slice(0, 2)}
                      src={u?.profile_pic?.url}
                      size="md"
                    />
                    <div>
                      <div className="font-medium text-slate-800 text-sm">
                        {u?.full_name}
                      </div>
                      <div className="text-xs text-slate-400">{u?.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs">{u?.role}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={u?.is_active ? "Active" : "Pending"} />
                </td>
                <td className="px-4 py-3 pr-6 text-slate-400 text-xs">
                  {u?.created_at ? formatDate(u?.created_at) : ""}
                </td>
              </tr>
            ))}
          </TableShell>

          {/* Load More Trigger */}
          <div className="p-4 border-t border-slate-50 text-center">
            <button
              onClick={() => router.push("/admin/users")}
              className="cursor-pointer text-xs font-semibold text-violet-600 hover:text-violet-800"
            >
              View all users
            </button>
          </div>
        </Card>

        {/* Pending Approvals */}
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-slate-800">
              Pending vendor approvals
            </h3>
            <span className="bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              {pendingVendors.length} pending
            </span>
          </CardHeader>
          {pendingVendors.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              All caught up!
            </div>
          ) : (
            <TableShell headers={["Vendor", "Category", "Actions"]}>
              {pendingVendors.map((v: Vendor) => (
                <tr
                  key={v.id}
                  className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors"
                >
                  <td className="px-4 py-3 pl-6">
                    <div className="flex items-center gap-2.5">
                      <Avatar initials={v.initials} size="md" />
                      <div>
                        <div className="font-medium text-slate-800 text-sm">
                          {v.name}
                        </div>
                        <div className="text-xs text-slate-400">{v.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {v.category}
                  </td>
                  <td className="px-4 py-3 pr-6">
                    <div className="flex gap-1.5">
                      <button className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-colors">
                        <Check size={11} /> Approve
                      </button>
                      <button className="flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors">
                        <X size={11} /> Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </TableShell>
          )}
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-slate-800">Recent orders</h3>
          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            <Download size={12} /> Export
          </button>
        </CardHeader>
        <TableShell
          headers={[
            "Order ID",
            "Customer",
            "Store",
            "Amount",
            "Items",
            "Status",
            "Date",
          ]}
        >
          {recentOrders.map((o: Order) => (
            <tr
              key={o.id}
              className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors"
            >
              <td className="px-4 py-3 pl-6 font-mono text-xs text-violet-600 font-semibold">
                #{o.id}
              </td>
              <td className="px-4 py-3 text-slate-700 text-sm">{o.customer}</td>
              <td className="px-4 py-3 text-slate-500 text-xs">{o.store}</td>
              <td className="px-4 py-3 font-semibold text-slate-800 text-sm">
                {formatCurrency(o.amount)}
              </td>
              <td className="px-4 py-3 text-slate-400 text-xs">
                {o.items} item{o.items !== 1 ? "s" : ""}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={o.status} />
              </td>
              <td className="px-4 py-3 pr-6 text-slate-400 text-xs">
                {o.date}
              </td>
            </tr>
          ))}
        </TableShell>
      </Card>
    </div>
  );
}
