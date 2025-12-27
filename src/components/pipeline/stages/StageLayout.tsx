import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Edit, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StageLayoutProps {
  // Input section
  inputContent: React.ReactNode;
  
  // Output section
  outputContent: React.ReactNode;
  hasOutput: boolean;
  
  // Actions
  onGenerate: () => void;
  onRegenerate?: () => void;
  onEdit?: () => void;
  onContinue: () => void;
  
  // State
  isGenerating: boolean;
  canContinue: boolean;
  generateLabel: string;
  creditsCost: string;
  
  // Optional - only show edit/regenerate for AI-generated content
  isAIGenerated?: boolean;
  
  // Output actions (download, copy, etc.)
  outputActions?: React.ReactNode;
  
  // Stage navigation (passed from parent)
  stageNavigation?: React.ReactNode;
}

export default function StageLayout({
  inputContent,
  outputContent,
  hasOutput,
  onGenerate,
  onRegenerate,
  onEdit,
  onContinue,
  isGenerating,
  canContinue,
  generateLabel,
  creditsCost,
  isAIGenerated = false,
  outputActions,
  stageNavigation,
}: StageLayoutProps) {
  return (
    <div className="flex h-full">
      {/* Input Section */}
      <div className="flex-1 flex flex-col border-r">
        <div className="flex-1 overflow-auto p-6">
          {/* Stage Navigation */}
          {stageNavigation && (
            <>
              <div className="mb-4">
                {stageNavigation}
              </div>
              <div className="h-px bg-border mb-6" />
            </>
          )}
          
          {inputContent}
        </div>

        <div className="px-6 py-4 border-t bg-muted/20">
          <Button 
            className="w-full" 
            onClick={onGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                {generateLabel} • {creditsCost}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Output Section */}
      <div className="flex-1 flex flex-col bg-muted/10">
        <div className="flex-1 overflow-auto p-6">
          {/* Output Actions Row */}
          {hasOutput && (
            <div className="flex items-center justify-end gap-1 mb-4">
              {isAIGenerated && (
                <>
                  {onEdit && (
                    <Button variant="ghost" size="sm" onClick={onEdit} disabled={isGenerating}>
                      <Edit className="h-4 w-4 mr-1.5" />
                      Edit
                    </Button>
                  )}
                  {onRegenerate && (
                    <Button variant="ghost" size="sm" onClick={onRegenerate} disabled={isGenerating}>
                      <RefreshCw className={cn("h-4 w-4 mr-1.5", isGenerating && "animate-spin")} />
                      Regenerate
                    </Button>
                  )}
                </>
              )}
              {outputActions}
            </div>
          )}
          
          {hasOutput ? (
            outputContent
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <p className="text-lg font-medium">No output yet</p>
              <p className="text-sm">Generate or upload content to see the result</p>
            </div>
          )}
        </div>

        {hasOutput && (
          <div className="px-6 py-4 border-t bg-muted/20">
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
