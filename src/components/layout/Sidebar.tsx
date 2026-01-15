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
  FolderKanban,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Projects", href: "/admin/projects", icon: FolderKanban },
  { name: "Services", href: "/admin/services", icon: Layers },
  { name: "Containers", href: "/admin/containers", icon: Box },
  { name: "Logs", href: "/admin/logs", icon: ScrollText },
  { name: "Alerts", href: "/admin/alerts", icon: Bell },
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
            className="group flex items-center gap-2 text-sm text-muted-foreground transition-all duration-200 hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
            Back to Home
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4" aria-label="관리자 네비게이션">
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
                className={cn(
                  // 기본 트랜지션 및 그룹 호버
                  "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                  isActive
                    // 액티브 상태 강조 (shadow 추가)
                    ? "bg-primary text-primary-foreground shadow-sm"
                    // 호버 효과 강화 (translate-x 추가)
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground hover:translate-x-1"
                )}
              >
                {/* 아이콘 호버 효과 */}
                <item.icon className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" aria-hidden="true" />
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
