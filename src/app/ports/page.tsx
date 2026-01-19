/**
 * Ports Page (공개 페이지)
 * 포트 레지스트리를 조회하고 빠른 예약 기능을 제공하는 페이지
 */

import { PortsContent } from "./PortsContent";
import { PortsHeader } from "./PortsHeader";
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
      {/* Header (Client Component for HelpButton) */}
      <div className="mb-8">
        <PortsHeader />
      </div>

      {/* Content (Client Component) */}
      <PortsContent services={services} projects={projects} />
    </div>
  );
}
