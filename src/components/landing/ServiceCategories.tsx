import Link from "next/link";
import { Brain, Workflow, Server, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { services } from "@/config/services";
import type { ServiceCategory } from "@/types/service";
import { cn } from "@/lib/utils";

const categories: {
  id: ServiceCategory;
  name: string;
  description: string;
  icon: typeof Brain;
  gradient: string;
}[] = [
  {
    id: "ai",
    name: "AI Projects",
    description: "AI 기반 도구 및 서비스",
    icon: Brain,
    gradient: "from-purple-500 to-pink-500",
  },
  {
    id: "n8n",
    name: "n8n & Automation",
    description: "워크플로우 자동화 서비스",
    icon: Workflow,
    gradient: "from-orange-500 to-amber-500",
  },
  {
    id: "infrastructure",
    name: "Infrastructure",
    description: "개발 인프라 및 도구",
    icon: Server,
    gradient: "from-blue-500 to-cyan-500",
  },
];

export function ServiceCategories() {
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">Service Categories</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            카테고리별로 서비스를 탐색하세요
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => {
            const count = services.filter(
              (s) => s.category === category.id
            ).length;
            const runningCount = services.filter(
              (s) => s.category === category.id && s.status === "running"
            ).length;

            return (
              <Link key={category.id} href={`/services?category=${category.id}`}>
                <Card hover className="h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div
                        className={cn(
                          "flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br",
                          category.gradient
                        )}
                      >
                        <category.icon className="h-6 w-6 text-white" />
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>

                    <h3 className="mt-4 text-xl font-semibold">
                      {category.name}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {category.description}
                    </p>

                    <div className="mt-4 flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">
                        {count} services
                      </span>
                      {runningCount > 0 && (
                        <span className="flex items-center gap-1 text-green-500">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse-dot" />
                          {runningCount} running
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
