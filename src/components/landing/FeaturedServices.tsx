import Link from "next/link";
import { ExternalLink, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/services/StatusBadge";
import { TechBadge } from "@/components/services/TechBadge";
import { getFeaturedServices } from "@/config/services";

export function FeaturedServices() {
  const featuredServices = getFeaturedServices();

  return (
    <section className="border-t bg-secondary/30 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold sm:text-4xl">Featured Services</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              현재 실행 중인 주요 서비스
            </p>
          </div>
          <Button asChild variant="ghost" className="hidden gap-2 sm:flex">
            <Link href="/services">
              모든 서비스 보기
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featuredServices.map((service) => (
            <Card key={service.id} hover className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-xl">{service.name}</CardTitle>
                  <StatusBadge status={service.status} />
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <p className="text-sm text-muted-foreground">
                  {service.description}
                </p>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {service.techStack.slice(0, 4).map((tech) => (
                    <TechBadge key={tech} tech={tech} size="sm" />
                  ))}
                  {service.techStack.length > 4 && (
                    <span className="px-1.5 py-0.5 text-xs text-muted-foreground">
                      +{service.techStack.length - 4}
                    </span>
                  )}
                </div>

                {service.port && (
                  <p className="mt-4 text-sm text-muted-foreground">
                    Port: <span className="font-mono">{service.port}</span>
                  </p>
                )}

                <div className="mt-auto flex items-center gap-2 pt-6">
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link href={`/services/${service.id}`}>상세 보기</Link>
                  </Button>
                  {service.url && (
                    <Button asChild variant="ghost" size="sm">
                      <a
                        href={service.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 flex justify-center sm:hidden">
          <Button asChild variant="outline" className="gap-2">
            <Link href="/services">
              모든 서비스 보기
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
