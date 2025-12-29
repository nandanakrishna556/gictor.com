import React from 'react';
import { Button } from '@/components/ui/button';
import { Shuffle, Edit, ArrowRight, Loader2 } from 'lucide-react';
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
}: StageLayoutProps) {
  return (
    <div className="flex h-full overflow-hidden">
      {/* Input Section - Fixed width */}
      <div className="w-1/2 flex-shrink-0 flex flex-col border-r min-h-0">
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          <h3 className="font-medium text-lg mb-4">Input</h3>
          {inputContent}
        </div>

        <div className="px-6 py-4 border-t bg-muted/20 space-y-2">
          <Button 
            className="w-full" 
            onClick={onGenerate}
            disabled={isGenerating || generateDisabled}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          {/* Output Header with Actions */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-lg">Output</h3>
            {hasOutput && (
              <div className="flex items-center gap-1">
                {isAIGenerated && (
                  <>
                    {onEdit && (
                      <Button variant="ghost" size="sm" onClick={onEdit} disabled={isGenerating}>
                        <Edit className="h-4 w-4 mr-1.5" />
                        Edit
                      </Button>
                    )}
                    {onRemix && (
                      <Button variant="ghost" size="sm" onClick={onRemix} disabled={isGenerating}>
                        <Shuffle className={cn("h-4 w-4 mr-1.5", isGenerating && "animate-spin")} />
                        Remix
                      </Button>
                    )}
                  </>
                )}
                {outputActions}
              </div>
            )}
          </div>
          
          {hasOutput ? (
            outputContent
          ) : (
            <div className="flex flex-col items-center justify-center h-[calc(100%-2rem)] text-center text-muted-foreground">
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
