import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, FolderOpen, FileVideo, FileText, Clock, Image, Video, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProjects } from '@/hooks/useProjects';
import { useProfile } from '@/hooks/useProfile';
import { useRecentFiles, RecentFile } from '@/hooks/useRecentFiles';
import MainLayout from '@/components/layout/MainLayout';
import AppHeader from '@/components/layout/AppHeader';
import { FileDetailModalEnhanced } from '@/components/files/FileDetailModalEnhanced';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const fileTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  first_frame: Image,
  talking_head: Video,
  script: FileText,
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { projects } = useProjects();
  const { profile } = useProfile();
  const { data: recentFiles, isLoading: recentFilesLoading } = useRecentFiles(10);
  const [selectedFile, setSelectedFile] = useState<RecentFile | null>(null);

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
      value: recentFiles?.filter(f => f.file_type === 'talking_head').length || 0,
      icon: FileVideo,
      color: 'text-purple-500',
    },
    {
      title: 'Images Generated',
      value: recentFiles?.filter(f => f.file_type === 'first_frame').length || 0,
      icon: Image,
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
              Recent Files
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentFilesLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 animate-pulse rounded-lg bg-secondary" />
                ))}
              </div>
            ) : recentFiles && recentFiles.length > 0 ? (
              <div className="space-y-2">
                {recentFiles.map((file) => {
                  const FileIcon = fileTypeIcons[file.file_type] || FileText;
                  return (
                    <div
                      key={file.id}
                      onClick={() => setSelectedFile(file)}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer group"
                    >
                      {/* Thumbnail or Icon */}
                      <div className="h-12 w-12 rounded-lg overflow-hidden bg-secondary flex-shrink-0 flex items-center justify-center">
                        {file.preview_url ? (
                          <img 
                            src={file.preview_url} 
                            alt={file.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <FileIcon className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>

                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <FileIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="font-medium truncate">{file.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="truncate">{file.project_name}</span>
                          <span>•</span>
                          <span className="flex-shrink-0">
                            {formatDistanceToNow(new Date(file.updated_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className={cn(
                        'px-2 py-1 rounded text-xs font-medium flex-shrink-0',
                        file.status === 'completed' && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                        file.status === 'processing' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                        file.status === 'failed' && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                        !['completed', 'processing', 'failed'].includes(file.status) && 'bg-secondary text-muted-foreground'
                      )}>
                        {file.status === 'completed' ? 'Done' : file.status === 'processing' ? 'Processing' : file.status === 'failed' ? 'Failed' : file.status}
                      </div>

                      {/* View Project Link */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/projects/${file.project_id}`);
                        }}
                        className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-secondary transition-all"
                        title="View in project"
                      >
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                No recent files. Start creating content to see your activity here.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* File Detail Modal */}
      <FileDetailModalEnhanced
        file={selectedFile}
        isOpen={!!selectedFile}
        onClose={() => setSelectedFile(null)}
      />
    </MainLayout>
  );
}
