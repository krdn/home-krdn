"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Layers,
  Box,
  ScrollText,
  Activity,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Services", href: "/admin/services", icon: Layers },
  { name: "Containers", href: "/admin/containers", icon: Box },
  { name: "Logs", href: "/admin/logs", icon: ScrollText },
  { name: "System", href: "/admin/system", icon: Activity },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 flex-shrink-0 border-r bg-card lg:block">
      <div className="flex h-full flex-col">
        {/* Back to Home */}
        <div className="border-b p-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navigation.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t p-4">
          <p className="text-xs text-muted-foreground">Admin Panel v1.0</p>
        </div>
      </div>
    </aside>
  );
}
