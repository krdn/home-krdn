import { Sidebar } from "@/components/layout/Sidebar";
import { MobileSidebar } from "@/components/layout/MobileSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col lg:flex-row">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <MobileSidebar />
        <main className="flex-1 overflow-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
