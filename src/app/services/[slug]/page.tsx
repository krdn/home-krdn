import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  FolderOpen,
  Server,
  Box,
} from "lucide-react";
import { services, getServiceById } from "@/config/services";
import { getIcon } from "@/lib/icons";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/services/StatusBadge";
import { TechBadge } from "@/components/services/TechBadge";
import { CATEGORY_LABELS } from "@/types/service";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return services.map((service) => ({
    slug: service.id,
  }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const service = getServiceById(slug);
  if (!service) return { title: "Service Not Found" };

  return {
    title: `${service.name} - krdn`,
    description: service.description,
  };
}

export default async function ServiceDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const service = getServiceById(slug);

  if (!service) {
    notFound();
  }

  const IconComponent = getIcon(service.icon);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back button */}
      <Link
        href="/services"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Services
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-xl",
                service.category === "ai" &&
                  "bg-gradient-to-br from-purple-500/20 to-pink-500/20",
                service.category === "n8n" &&
                  "bg-gradient-to-br from-orange-500/20 to-amber-500/20",
                service.category === "infrastructure" &&
                  "bg-gradient-to-br from-blue-500/20 to-cyan-500/20"
              )}
            >
              <IconComponent className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold sm:text-3xl">
                  {service.name}
                </h1>
                <StatusBadge status={service.status} />
              </div>
              <p className="mt-1 text-muted-foreground">
                {CATEGORY_LABELS[service.category]}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {service.url && (
              <Button asChild className="gap-2">
                <a
                  href={service.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open App
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
            <Button asChild variant="outline">
              <Link href="/admin">관리</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Description */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {service.longDescription || service.description}
          </p>
        </CardContent>
      </Card>

      {/* Info Grid */}
      <div className="mb-6 grid gap-6 sm:grid-cols-2">
        {/* Tech Stack */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tech Stack</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {service.techStack.map((tech) => (
                <TechBadge key={tech} tech={tech} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {service.port && (
              <div className="flex items-center gap-2 text-sm">
                <Server className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Port:</span>
                <span className="font-mono">{service.port}</span>
              </div>
            )}
            {service.path && (
              <div className="flex items-center gap-2 text-sm">
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Path:</span>
                <span className="font-mono text-xs truncate max-w-[200px]">
                  {service.path}
                </span>
              </div>
            )}
            {service.containers.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Box className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Containers:</span>
                <span>{service.containers.length}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Features */}
      {service.features.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Features</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2 sm:grid-cols-2">
              {service.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Containers */}
      {service.containers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Containers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {service.containers.map((container) => (
                <span
                  key={container}
                  className="rounded-md bg-secondary px-2.5 py-1 text-sm font-mono"
                >
                  {container}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
