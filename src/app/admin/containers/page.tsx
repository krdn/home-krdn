import { ContainerList } from '@/components/admin/ContainerList';
import { HelpButton } from '@/components/help';

export default function AdminContainersPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl flex items-center gap-2">
          Containers
          <HelpButton helpId="page-containers" size="sm" />
        </h1>
        <p className="mt-1 text-muted-foreground">
          Docker 컨테이너 관리 (10초마다 자동 갱신)
        </p>
      </div>

      {/* Container List - Real-time */}
      <ContainerList />
    </div>
  );
}
