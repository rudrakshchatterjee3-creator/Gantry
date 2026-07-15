"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Radar,
  Users,
  Siren,
  Radio,
  Settings,
  ShieldCheck,
  Globe2,
  LogOut,
} from "lucide-react";
import clsx from "clsx";
import { useVenueStore } from "@/lib/store/useVenueStore";
import { GantryMark } from "@/components/brand/GantryLogo";
import { signOutAction } from "@/app/actions";

const NAV_ITEMS = [
  { href: "/tournament", label: "Tournament HQ", icon: Globe2 },
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/zones", label: "Zone Monitor", icon: Radar },
  { href: "/crowd", label: "Crowd Flow", icon: Users },
  { href: "/anomalies", label: "Anomalies", icon: Siren },
  { href: "/dispatch", label: "Dispatch Log", icon: Radio },
  { href: "/security", label: "Security", icon: ShieldCheck },
];

export function Sidebar() {
  const pathname = usePathname();
  const venue = useVenueStore((state) => state.selectedVenue);

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-surface-border bg-surface-panel">
      <Link href="/welcome" className="flex items-center gap-2 border-b border-surface-border px-5 py-5">
        <GantryMark className="h-8 w-8 shrink-0" />
        <div>
          <p className="font-display text-lg font-bold leading-none tracking-wide text-slate-100">GANTRY</p>
          <p className="text-[11px] text-slate-500">Matchday Ops · {venue.name}</p>
        </div>
      </Link>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-broadcast-muted text-broadcast"
                  : "text-slate-400 hover:bg-surface-raised/60 hover:text-slate-200"
              )}
            >
              <Icon size={16} strokeWidth={1.75} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-surface-border px-3 py-4">
        <Link
          href="/settings"
          className={clsx(
            "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
            pathname === "/settings"
              ? "bg-broadcast-muted text-broadcast"
              : "text-slate-400 hover:bg-surface-raised/60 hover:text-slate-200"
          )}
        >
          <Settings size={16} strokeWidth={1.75} />
          Settings
        </Link>
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-critical-muted hover:text-critical"
          >
            <LogOut size={16} strokeWidth={1.75} />
            Sign Out
          </button>
        </form>
      </div>
    </aside>
  );
}
