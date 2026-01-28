// app/project-management/page.js
'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const ProjectManagement = dynamic(
  () => import('@/components/shared-components/project/ProjectManagement'),
  {
    loading: () => <ProjectManagementSkeleton />,
    ssr: false,
  }
);

const ProjectManagementSkeleton = () => (
  <div className="min-h-screen p-6 space-y-6">
    <div className="h-10 bg-muted/50 rounded animate-pulse"></div>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-20 bg-muted/50 rounded animate-pulse"></div>
      ))}
    </div>
    <div className="h-16 bg-muted/50 rounded animate-pulse"></div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-48 bg-muted/50 rounded animate-pulse"></div>
      ))}
    </div>
  </div>
);

const Page = () => {
  return (
    <Suspense fallback={<ProjectManagementSkeleton />}>
      <ProjectManagement />
    </Suspense>
  );
};

export default Page;