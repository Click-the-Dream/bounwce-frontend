"use client";

import AdminLayout from "./_components/AdminLayout";

export default function AdminDashboard({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayout children={children} />;
}
