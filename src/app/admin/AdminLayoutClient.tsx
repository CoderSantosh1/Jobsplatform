"use client";

import AdminShell from "./_components/AdminShell";

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
