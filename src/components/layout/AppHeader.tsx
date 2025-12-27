import { Link } from 'react-router-dom';
import { ChevronRight, Grid3X3, Kanban, Plus, FolderOpen, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FilterPopover from '@/components/modals/FilterPopover';
import type { Tag } from '@/hooks/useTags';

interface BreadcrumbItem {
  label: string;
  href?: string | undefined;
}

interface AppHeaderProps {
  breadcrumbs: BreadcrumbItem[];
  viewMode?: 'grid' | 'kanban';
  onViewModeChange?: (mode: 'grid' | 'kanban') => void;
  onCreateFolder?: () => void;
  onCreateNew?: () => void;
  showCreateButtons?: boolean;
  tags?: Tag[];
  selectedTags?: string[];
  selectedStatuses?: string[];
  selectedFileTypes?: string[];
  onTagsChange?: (tags: string[]) => void;
  onStatusesChange?: (statuses: string[]) => void;
  onFileTypesChange?: (types: string[]) => void;
  onCreateTag?: () => void;
  onDeleteTag?: (id: string) => void;
  onClearFilters?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onSelectMode?: () => void;
  bulkMode?: boolean;
}

export default function AppHeader({
  breadcrumbs,
  viewMode = 'grid',
  onViewModeChange,
  onCreateFolder,
  onCreateNew,
  showCreateButtons = false,
  tags = [],
  selectedTags = [],
  selectedStatuses = [],
  selectedFileTypes = [],
  onTagsChange = () => {},
  onStatusesChange = () => {},
  onFileTypesChange = () => {},
  onCreateTag = () => {},
  onDeleteTag,
  onClearFilters = () => {},
  searchQuery = '',
  onSearchChange,
  onSelectMode,
  bulkMode = false,
}: AppHeaderProps) {

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border bg-background px-6">
      {/* Breadcrumbs - styled like reference image */}
      <nav className="flex items-center gap-2 min-w-0">
        {breadcrumbs.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            {index === 0 && (
              <FolderOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            )}
            {item.href ? (
              <Link
                to={item.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground whitespace-nowrap"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-sm font-medium text-foreground whitespace-nowrap">
                {item.label}
              </span>
            )}
            {index < breadcrumbs.length - 1 && (
              <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            )}
          </div>
        ))}
      </nav>

      {/* Right Side Actions */}
      <div className="flex items-center gap-2">
        {/* Search - compact */}
        {showCreateButtons && onSearchChange && (
          <div className="relative w-48">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-8 pl-8 text-sm"
            />
          </div>
        )}

        {/* Select Button */}
        {showCreateButtons && onSelectMode && !bulkMode && (
          <Button
            variant="outline"
            size="sm"
            onClick={onSelectMode}
            className="h-8 text-sm"
          >
            Select
          </Button>
        )}

        {/* Filter */}
        {showCreateButtons && (
          <FilterPopover
            tags={tags}
            selectedTags={selectedTags}
            selectedStatuses={selectedStatuses}
            selectedFileTypes={selectedFileTypes}
            onTagsChange={onTagsChange}
            onStatusesChange={onStatusesChange}
            onFileTypesChange={onFileTypesChange}
            onCreateTag={onCreateTag}
            onDeleteTag={onDeleteTag}
            onClearAll={onClearFilters}
          />
        )}

        {/* View Toggle */}
        {onViewModeChange && (
          <div className="flex rounded-lg border border-border bg-secondary/50 p-0.5">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`rounded-md px-2 py-1 text-sm transition-all ${
                viewMode === 'grid'
                  ? 'bg-background font-medium text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => onViewModeChange('kanban')}
              className={`rounded-md px-2 py-1 text-sm transition-all ${
                viewMode === 'kanban'
                  ? 'bg-background font-medium text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Kanban className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Create Button */}
        {showCreateButtons && onCreateNew && (
          <Button
            size="sm"
            onClick={onCreateNew}
            className="h-8 gap-1.5 rounded-lg bg-primary font-medium text-primary-foreground transition-all hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Create new
          </Button>
        )}
      </div>
    </header>
  );
}
