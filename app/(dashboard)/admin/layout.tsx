"use client";

import AdminLayout from "./_components/AdminLayout";
import AdminSidebar from "./_components/Sidebar";

export default function AdminDashboard({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayout children={children} />;
}
