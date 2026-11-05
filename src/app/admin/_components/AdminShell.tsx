"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, ExternalLink, GraduationCap, LogOut, Menu, X } from "lucide-react";
import { ADMIN_LOGIN_PATH, ADMIN_TOKEN_KEY } from "@/lib/admin-fetch";
import { NAV } from "./nav";

/** Email of the signed-in admin, read from the JWT payload (display only; the server checks the token). */
function adminEmail(): string {
  try {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    const payload = token ? JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))) : null;
    return typeof payload?.email === "string" ? payload.email : "";
  } catch {
    return "";
  }
}

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname() ?? "";
  const tab = useSearchParams()?.get("tab") ?? null;
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  return (
    <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3 pb-6">
      {NAV.map((group) => {
        const closed = collapsed[group.title];
        return (
          <div key={group.title} className="mt-5 first:mt-2">
            <button
              type="button"
              onClick={() => setCollapsed((c) => ({ ...c, [group.title]: !c[group.title] }))}
              className="flex w-full items-center justify-between px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-600"
              aria-expanded={!closed}
            >
              {group.title}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${closed ? "-rotate-90" : ""}`} />
            </button>
            {!closed && (
              <ul className="mt-1 space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = item.match?.(path, tab) ?? false;
                  if (!item.href) {
                    return (
                      <li key={item.label}>
                        <span
                          className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400"
                          title="Planned for a later phase"
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="flex-1 truncate">{item.label}</span>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">Soon</span>
                        </span>
                      </li>
                    );
                  }
                  return (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        aria-current={active ? "page" : undefined}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                          active ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        <Icon className={`h-4 w-4 shrink-0 ${active ? "text-indigo-600" : "text-slate-400"}`} />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <Link href="/admin" className="flex items-center gap-2.5 px-6 py-5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
        <GraduationCap className="h-5 w-5" />
      </span>
      <span className="leading-tight">
        <span className="block text-sm font-bold text-slate-900">SarkariResultsNow</span>
        <span className="block text-xs font-medium text-indigo-600">Admin Panel</span>
      </span>
    </Link>
  );
}

/** Admin-only frame: sidebar, top bar and mobile drawer. Not used by any public page. */
export default function AdminShell({ children }: { children: React.ReactNode }) {
  const path = usePathname() ?? "";
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [ready, setReady] = useState(false);
  const isLogin = path.startsWith(ADMIN_LOGIN_PATH);

  useEffect(() => {
    if (isLogin) return;
    // Client-side gate for the UI only; every admin API still verifies the token on the server.
    if (!localStorage.getItem(ADMIN_TOKEN_KEY)) {
      router.replace(ADMIN_LOGIN_PATH);
      return;
    }
    setEmail(adminEmail());
    setReady(true);
  }, [isLogin, router, path]);

  if (isLogin) return <>{children}</>;

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => {});
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    router.push(ADMIN_LOGIN_PATH);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
        <Brand />
        <Suspense fallback={null}>
          <Sidebar />
        </Suspense>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin menu">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between pr-3">
              <Brand />
              <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <Suspense fallback={null}>
              <Sidebar onNavigate={() => setOpen(false)} />
            </Suspense>
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
          <button type="button" onClick={() => setOpen(true)} aria-label="Open menu" className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 sm:flex"
          >
            View site <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <div className="flex items-center gap-3 border-l border-slate-200 pl-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold uppercase text-white">
              {(email || "A").charAt(0)}
            </span>
            <span className="hidden min-w-0 leading-tight md:block">
              <span className="block max-w-[180px] truncate text-sm font-semibold text-slate-900">{email || "Admin"}</span>
              <span className="block text-xs text-slate-500">Administrator</span>
            </span>
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>
        <main className="px-4 py-6 sm:px-6 lg:px-8">{ready ? children : <div className="h-40 animate-pulse rounded-2xl bg-white" />}</main>
      </div>
    </div>
  );
}
