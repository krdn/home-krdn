"use client";

import { useState, useMemo } from "react";
import { Search, Filter, X } from "lucide-react";
import { ServiceCard } from "@/components/services/ServiceCard";
import { Button } from "@/components/ui/Button";
import type { Service, ServiceCategory } from "@/types/service";
import { cn } from "@/lib/utils";

const categories: Array<{ id: ServiceCategory | "all"; label: string }> = [
  { id: "all", label: "All" },
  { id: "ai", label: "AI" },
  { id: "n8n", label: "n8n" },
  { id: "infrastructure", label: "Infra" },
];

interface ServicesContentProps {
  initialServices: Service[];
}

export function ServicesContent({ initialServices }: ServicesContentProps) {
  const [selectedCategory, setSelectedCategory] = useState<
    ServiceCategory | "all"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showRunningOnly, setShowRunningOnly] = useState(false);

  const filteredServices = useMemo(() => {
    let result =
      selectedCategory === "all"
        ? initialServices
        : initialServices.filter((s) => s.category === selectedCategory);

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.description.toLowerCase().includes(query) ||
          s.techStack.some((t) => t.toLowerCase().includes(query))
      );
    }

    if (showRunningOnly) {
      result = result.filter((s) => s.status === "running");
    }

    return result;
  }, [initialServices, selectedCategory, searchQuery, showRunningOnly]);

  const runningCount = initialServices.filter(
    (s) => s.status === "running"
  ).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold sm:text-4xl">Services</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          {initialServices.length}개의 서비스 중 {runningCount}개 실행 중
        </p>
      </div>

      {/* Filters */}
      <div className="mb-8 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="서비스 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-lg border bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring sm:max-w-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Category tabs & filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border p-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  selectedCategory === cat.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <Button
            variant={showRunningOnly ? "secondary" : "outline"}
            size="sm"
            onClick={() => setShowRunningOnly(!showRunningOnly)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Running only
          </Button>
        </div>
      </div>

      {/* Results */}
      {filteredServices.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">검색 결과가 없습니다</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredServices.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      )}
    </div>
  );
}
