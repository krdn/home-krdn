/**
 * Ports Page (공개 페이지)
 * 포트 레지스트리를 조회하고 빠른 예약 기능을 제공하는 페이지
 */

import { Network } from "lucide-react";
import { PortsContent } from "./PortsContent";
import { getAllServices } from "@/lib/services";
import { getAllProjects } from "@/lib/projects";

export const metadata = {
  title: "Ports - Krdn Home",
  description: "개발 서버 포트 레지스트리 및 할당 현황",
};

export default async function PortsPage() {
  // 서버에서 서비스와 프로젝트 데이터를 가져옴
  const [services, projects] = await Promise.all([
    getAllServices(),
    getAllProjects(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 p-2">
            <Network className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold sm:text-4xl">Port Registry</h1>
            <p className="mt-1 text-lg text-muted-foreground">
              개발 서버 포트 할당 현황 및 예약
            </p>
          </div>
        </div>
      </div>

      {/* Content (Client Component) */}
      <PortsContent services={services} projects={projects} />
    </div>
  );
}
