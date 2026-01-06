import { ContainerList } from '@/components/admin/ContainerList';

export default function AdminContainersPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Containers</h1>
        <p className="mt-1 text-muted-foreground">
          Docker 컨테이너 관리 (10초마다 자동 갱신)
        </p>
      </div>

      {/* Container List - Real-time */}
      <ContainerList />
    </div>
  );
}
