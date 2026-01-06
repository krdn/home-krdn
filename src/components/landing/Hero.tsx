import Link from "next/link";
import { ArrowRight, Layers, Settings } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getRunningServices } from "@/config/services";

export function Hero() {
  const runningCount = getRunningServices().length;

  return (
    <section className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10" />
        <div className="absolute top-0 left-1/4 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-pink-500/20 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
        <div className="text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-background/50 px-4 py-1.5 text-sm backdrop-blur-sm">
            <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse-dot" />
            <span className="text-muted-foreground">
              {runningCount} services running
            </span>
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            <span className="block">krdn</span>
            <span className="block bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              Development Hub
            </span>
          </h1>

          {/* Description */}
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            AI & Automation Services Platform
            <br />
            시스템에 개발된 모든 서비스를 소개하고 관리하는 통합 플랫폼
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="gap-2">
              <Link href="/services">
                <Layers className="h-5 w-5" />
                Services 보기
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2">
              <Link href="/admin">
                <Settings className="h-5 w-5" />
                Admin 패널
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
