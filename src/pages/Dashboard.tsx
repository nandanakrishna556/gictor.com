import { LayoutDashboard, FolderOpen, FileVideo, FileText, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProjects } from '@/hooks/useProjects';
import { useProfile } from '@/hooks/useProfile';
import MainLayout from '@/components/layout/MainLayout';
import AppHeader from '@/components/layout/AppHeader';

export default function Dashboard() {
  const { projects } = useProjects();
  const { profile } = useProfile();

  const stats = [
    {
      title: 'Total Projects',
      value: projects?.length || 0,
      icon: FolderOpen,
      color: 'text-blue-500',
    },
    {
      title: 'Credits Available',
      value: profile?.credits ?? 0,
      icon: LayoutDashboard,
      color: 'text-green-500',
    },
    {
      title: 'Videos Generated',
      value: 0,
      icon: FileVideo,
      color: 'text-purple-500',
    },
    {
      title: 'Scripts Created',
      value: 0,
      icon: FileText,
      color: 'text-orange-500',
    },
  ];

  return (
    <MainLayout>
      <AppHeader breadcrumbs={[{ label: 'Dashboard' }]} />
      <div className="p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Welcome back{profile?.full_name ? `, ${profile.full_name}` : ''}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's an overview of your content generation activity.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              No recent activity to show. Start creating content to see your activity here.
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
