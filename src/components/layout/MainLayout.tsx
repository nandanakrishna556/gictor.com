import { useState, ReactNode } from 'react';
import AppSidebar from './AppSidebar';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar collapsed={sidebarCollapsed} onCollapse={setSidebarCollapsed} />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
