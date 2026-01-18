import Link from "next/link";
import { Rocket, Code } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "./StatusBadge";
import { TechBadge } from "./TechBadge";
import { getIcon } from "@/lib/icons";
import { getServiceProdUrl, getServiceDevUrl } from "@/lib/service-utils";
import type { Service } from "@/types/service";
import { cn } from "@/lib/utils";

interface ServiceCardProps {
  service: Service;
  showControls?: boolean;
}

export function ServiceCard({ service, showControls = true }: ServiceCardProps) {
  const IconComponent = getIcon(service.icon);
  const prodUrl = getServiceProdUrl(service);
  const devUrl = getServiceDevUrl(service);

  return (
    <Card hover className="flex flex-col h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg",
                service.category === "ai" &&
                  "bg-gradient-to-br from-purple-500/20 to-pink-500/20",
                service.category === "n8n" &&
                  "bg-gradient-to-br from-orange-500/20 to-amber-500/20",
                service.category === "infrastructure" &&
                  "bg-gradient-to-br from-blue-500/20 to-cyan-500/20"
              )}
            >
              <IconComponent className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg">{service.name}</CardTitle>
          </div>
          <StatusBadge status={service.status} size="sm" />
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col pt-0">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {service.description}
        </p>

        <div className="mt-3 flex flex-wrap gap-1">
          {service.techStack.slice(0, 3).map((tech) => (
            <TechBadge key={tech} tech={tech} size="sm" />
          ))}
          {service.techStack.length > 3 && (
            <span className="px-1.5 py-0.5 text-xs text-muted-foreground">
              +{service.techStack.length - 3}
            </span>
          )}
        </div>

        {service.port && (
          <p className="mt-3 text-xs text-muted-foreground">
            Port: <span className="font-mono">{service.port}</span>
          </p>
        )}

        {showControls && (
          <div className="mt-auto flex items-center gap-2 pt-4">
            <Button asChild variant="outline" size="sm" className="flex-1">
              <Link href={`/services/${service.id}`}>상세 보기</Link>
            </Button>
            {prodUrl && (
              <Button asChild variant="ghost" size="sm">
                <a
                  href={prodUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Production (운영)"
                >
                  <Rocket className="h-4 w-4 text-green-500" />
                </a>
              </Button>
            )}
            {devUrl && (
              <Button asChild variant="ghost" size="sm">
                <a
                  href={devUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Development (개발)"
                >
                  <Code className="h-4 w-4 text-orange-500" />
                </a>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
