/**
 * Services Page (Server Component)
 * JSON 파일에서 서비스 데이터를 읽어 렌더링
 */

import { getAllServices } from "@/lib/services";
import { ServicesContent } from "@/components/services/ServicesContent";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Services - Krdn Home",
  description: "실행 중인 서비스와 프로젝트 인프라를 확인하세요",
};

export default async function ServicesPage() {
  const services = await getAllServices();

  return <ServicesContent initialServices={services} />;
}
