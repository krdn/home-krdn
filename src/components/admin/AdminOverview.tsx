'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { FolderKanban, Bell } from 'lucide-react';
import { useAlertStore } from '@/stores/alertStore';

export function AdminOverview() {
  const [projectCount, setProjectCount] = useState(0);
  const rules = useAlertStore((state) => state.rules);

  useEffect(() => {
    fetch('/api/projects')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setProjectCount(data.projects.length);
      })
      .catch(() => {});
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <FolderKanban className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{projectCount}</p>
              <p className="text-sm text-muted-foreground">Projects</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{rules.length}</p>
              <p className="text-sm text-muted-foreground">Alert Rules</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
