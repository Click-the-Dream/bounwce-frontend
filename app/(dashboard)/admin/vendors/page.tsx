"use client";

import { VENDORS } from "@/app/_utils/mock";
import { useMemo, useState } from "react";
import CardHeader from "../_components/CardHeader";
import Card from "../_components/Card";
import SearchBar from "../_components/SearchBar";
import TabRow from "../_components/TableRow";
import { Check, Eye, Pencil, Plus, Star, Unlock, X, Lock } from "lucide-react";
import TableShell from "../_components/TableShell";
import Avatar from "../_components/Avatar";
import { formatCurrency } from "@/app/_utils/utility";
import StatusBadge from "../_components/StatusBadge";
import IconBtn from "../_components/IconButton";

export default function VendorsPage() {
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return VENDORS.filter((v) => {
      const matchSearch =
        !search ||
        v.name.toLowerCase().includes(search.toLowerCase()) ||
        v.category.toLowerCase().includes(search.toLowerCase());
      return matchSearch;
    });
  }, [tab, search]);

  const tabs = [
    { key: "all", label: "All", count: VENDORS.length },
    {
      key: "verified",
      label: "Verified",
      count: VENDORS.filter((v) => v.status === "verified").length,
    },
    {
      key: "pending",
      label: "Pending",
      count: VENDORS.filter((v) => v.status === "pending").length,
    },
    {
      key: "suspended",
      label: "Suspended",
      count: VENDORS.filter((v) => v.status === "suspended").length,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div>
          <h3 className="font-semibold text-slate-800">Vendors</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {filtered.length} results
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search vendors…"
          />
          <TabRow tabs={tabs} active={tab} onChange={setTab} />

          <button className="cursor-pointer  h-7.5 flex-1 border border-[#F4F4F4] outline-[0.83px] p-2 rounded-lg text-xs font-medium flex items-center justify-center transition-all bg-orange text-white hover:bg-[#ee3d15]">
            <Plus fill="#8a0202" className="size-4 mr-1.75" />
            Add vendor
          </button>
        </div>
      </CardHeader>
      <TableShell
        headers={[
          "Vendor",
          "Category",
          "Stores",
          "Revenue",
          "Rating",
          "Status",
          "Joined",
          "Actions",
        ]}
      >
        {filtered.map((v) => (
          <tr
            key={v.id}
            className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors text-[13px]"
          >
            <td className="px-4 py-3.5 pl-6">
              <div className="flex items-center gap-2.5">
                <Avatar initials={v.initials} />
                <div>
                  <div className="font-medium text-slate-800">{v.name}</div>
                  <div className="text-xs text-slate-400">{v.email}</div>
                </div>
              </div>
            </td>
            <td className="px-4 py-3.5 text-slate-500 text-xs whitespace-nowrap">
              {v.category}
            </td>
            <td className="px-4 py-3.5 text-slate-600 text-sm">{v.stores}</td>
            <td className="px-4 py-3.5 font-medium text-slate-800 text-sm whitespace-nowrap">
              {v.revenue > 0 ? formatCurrency(v.revenue) : "—"}
            </td>
            <td className="px-4 py-3.5">
              {v.rating > 0 ? (
                <span className="flex items-center gap-1 text-sm text-amber-600 font-semibold">
                  <Star size={12} className="fill-amber-400 text-amber-400" />{" "}
                  {v.rating}
                </span>
              ) : (
                <span className="text-slate-300 text-xs">—</span>
              )}
            </td>
            <td className="px-4 py-3.5">
              <StatusBadge status={v.status} />
            </td>
            <td className="px-4 py-3.5 text-slate-400 text-xs whitespace-nowrap">
              {v.joined}
            </td>
            <td className="px-4 py-3.5 pr-6">
              <div className="flex items-center gap-1.5">
                {v.status === "pending" ? (
                  <>
                    <button className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-colors">
                      <Check size={11} /> Approve
                    </button>
                    <button className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors">
                      <X size={11} /> Reject
                    </button>
                  </>
                ) : (
                  <>
                    <IconBtn icon={Eye} label="View" />
                    <IconBtn icon={Pencil} label="Edit" />
                    <IconBtn
                      icon={v.status === "suspended" ? Unlock : Lock}
                      label={v.status === "suspended" ? "Restore" : "Suspend"}
                    />
                  </>
                )}
              </div>
            </td>
          </tr>
        ))}
      </TableShell>
      {filtered.length === 0 && (
        <div className="py-16 text-center text-slate-400 text-sm">
          No vendors match your filter.
        </div>
      )}
    </Card>
  );
}
