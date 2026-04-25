"use client";
import SecureRoute from "@/app/protocols/SecureRoutes";
import React from "react";

const layout = ({ children }: { children: React.ReactNode }) => {
  return <SecureRoute>{children}</SecureRoute>;
};

export default layout;
