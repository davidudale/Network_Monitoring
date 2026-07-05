"use client";

import {
  Bell,
  FileText,
  LayoutDashboard,
  ListPlus,
  ScrollText,
  Server,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";
import AuthGuard from "../Auth/AuthGuard";
import SignOutButton from "../Auth/SignOutButton";

const navigationLinks: {
  href: string;
  label: string;
  icon: LucideIcon;
}[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/devices", label: "Devices", icon: Server },
  { href: "/devices/add", label: "Add Device", icon: ListPlus },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/logs", label: "Logs", icon: ScrollText },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/profile", label: "Profile", icon: UserRound },
];

type AppShellProps = {
  children: ReactNode;
  title: string;
  description?: string;
};

export default function AppShell({
  children,
  title,
  description,
}: AppShellProps) {
  const pathname = usePathname();
  const isActiveLink = (href: string) => {
    if (href === "/dashboard") {
      return pathname === href;
    }

    if (href === "/devices") {
      return (
        pathname === href ||
        (pathname.startsWith("/devices/") && pathname !== "/devices/add")
      );
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-50 text-slate-950">
        <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white px-4 py-5 lg:block">
          <Link href="/dashboard" className="block px-2">
            <span className="text-lg font-semibold text-slate-950">
              Network Monitor
            </span>
            <span className="mt-1 block text-xs font-medium uppercase text-slate-500">
              Operations Console
            </span>
          </Link>

          <nav className="mt-8 space-y-1">
            {navigationLinks.map((item) => {
              const isActive = isActiveLink(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-cyan-50 text-cyan-800"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
                      isActive
                        ? "bg-cyan-700 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="lg:pl-64">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase text-slate-500 lg:hidden">
                  Network Monitor
                </p>
                <h1 className="truncate text-xl font-semibold text-slate-950">
                  {title}
                </h1>
                {description ? (
                  <p className="mt-1 hidden text-sm text-slate-600 sm:block">
                    {description}
                  </p>
                ) : null}
              </div>
              <SignOutButton />
            </div>

            <nav className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:hidden">
              {navigationLinks.map((item) => {
                const isActive = isActiveLink(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                      isActive
                        ? "bg-cyan-700 text-white"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </header>

          <main className="px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">{children}</div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
