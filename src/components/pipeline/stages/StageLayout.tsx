import React from 'react';
import { Button } from '@/components/ui/button';
import { Shuffle, Edit, ArrowRight, Loader2, Image as ImageIcon, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StageLayoutProps {
  // Input section
  inputContent: React.ReactNode;
  
  // Output section
  outputContent: React.ReactNode;
  hasOutput: boolean;
  
  // Actions
  onGenerate: () => void;
  onRemix?: () => void;
  onEdit?: () => void;
  onContinue: () => void;
  
  // State
  isGenerating: boolean;
  canContinue: boolean;
  generateLabel: string;
  creditsCost: string;
  generateDisabled?: boolean;
  
  // Optional - only show edit/remix for AI-generated content
  isAIGenerated?: boolean;
  
  // Output actions (download, copy, etc.)
  outputActions?: React.ReactNode;
  
  // Credits info shown below button
  creditsInfo?: React.ReactNode;
  
  // Empty state placeholder
  emptyStateIcon?: React.ReactNode;
  emptyStateTitle?: string;
  emptyStateSubtitle?: string;
}

export default function StageLayout({
  inputContent,
  outputContent,
  hasOutput,
  onGenerate,
  onRemix,
  onEdit,
  onContinue,
  isGenerating,
  canContinue,
  generateLabel,
  creditsCost,
  generateDisabled = false,
  isAIGenerated = false,
  outputActions,
  creditsInfo,
  emptyStateIcon,
  emptyStateTitle = "Generated image will appear here",
  emptyStateSubtitle = "Configure inputs and click Generate",
}: StageLayoutProps) {
  return (
    <div className="flex h-full overflow-hidden">
      {/* Input Section - Fixed width */}
      <div className="w-1/2 flex-shrink-0 flex flex-col border-r min-h-0">
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Input</h3>
          {inputContent}
        </div>

        <div className="shrink-0 px-6 py-4 border-t bg-background space-y-2">
          <Button 
            className="w-full" 
            onClick={onGenerate}
            disabled={isGenerating || generateDisabled}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" strokeWidth={1.5} />
                Generating...
              </>
            ) : creditsCost ? (
              <>
                {generateLabel} • {creditsCost}
              </>
            ) : (
              <>{generateLabel}</>
            )}
          </Button>
          {creditsInfo}
        </div>
      </div>

      {/* Output Section - Fixed width */}
      <div className="w-1/2 flex-shrink-0 flex flex-col bg-muted/10 min-h-0">
        <div className="flex-1 overflow-y-auto p-6 min-h-0 space-y-6">
          {/* Output Header */}
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Output</h3>
          
          {isGenerating ? (
            // Generating state - matches FrameModal
            <div className="space-y-4">
              <div className="aspect-square rounded-xl bg-secondary/50 flex items-center justify-center">
                <div className="text-center space-y-3">
                  <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" strokeWidth={1.5} />
                  <p className="text-sm text-muted-foreground">Generating your image...</p>
                </div>
              </div>
            </div>
          ) : hasOutput ? (
            // Has output - show content with actions
            <div className="space-y-4 animate-fade-in">
              {outputContent}
              {/* Output actions - download, etc. */}
              {outputActions && (
                <div className="flex items-center gap-2">
                  {outputActions}
                </div>
              )}
            </div>
          ) : (
            // Empty state - matches FrameModal exactly
            <div className="aspect-square rounded-xl bg-secondary/30 border-2 border-dashed border-border flex flex-col items-center justify-center gap-2">
              {emptyStateIcon || <ImageIcon className="h-10 w-10 text-muted-foreground/50" strokeWidth={1.5} />}
              <p className="text-muted-foreground text-sm">{emptyStateTitle}</p>
              <p className="text-muted-foreground/70 text-xs">{emptyStateSubtitle}</p>
            </div>
          )}
        </div>

        {hasOutput && (
          <div className="shrink-0 px-6 py-4 border-t bg-background">
            <Button className="w-full" onClick={onContinue} disabled={!canContinue}>
              Continue to Next Stage
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
