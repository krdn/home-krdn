"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Layers,
  Box,
  ScrollText,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Services", href: "/admin/services", icon: Layers },
  { name: "Containers", href: "/admin/containers", icon: Box },
  { name: "Logs", href: "/admin/logs", icon: ScrollText },
  { name: "System", href: "/admin/system", icon: Activity },
];

export function MobileSidebar() {
  const pathname = usePathname();

  return (
    <nav
      className="flex items-center gap-1 overflow-x-auto border-b bg-card px-4 py-2 lg:hidden"
      aria-label="관리자 모바일 네비게이션"
    >
      {navigation.map((item) => {
        const isActive =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.name}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            aria-label={item.name}
            className={cn(
              "flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary"
            )}
          >
            <item.icon className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
