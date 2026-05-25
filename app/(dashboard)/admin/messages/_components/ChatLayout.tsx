"use client";

import { ReactNode } from "react";

export default function AdminMessagingLayout({
  sidebar,
  chat,
}: {
  sidebar: ReactNode;
  chat: ReactNode;
}) {
  return (
    <div className="flex h-[calc(100vh-64px)] bg-[#f9f9f8] overflow-hidden">
      {sidebar}
      {chat}
    </div>
  );
}
