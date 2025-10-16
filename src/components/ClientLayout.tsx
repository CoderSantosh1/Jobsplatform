// components/ClientLayout.tsx
"use client";

import React, { ReactNode } from "react";
import AdInjector from "@/components/AdInjector";

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      {/* AdInjector runs only in the browser after hydration */}
      <AdInjector />
    </>
  );
}
