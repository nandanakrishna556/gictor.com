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
  
  // Optional - only show edit/remix for AI-generated content
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
  onRemix,
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
            <div className="mb-6 pb-5 border-b-2 border-primary/20">
              <div className="bg-muted/40 rounded-lg p-4">
                {stageNavigation}
              </div>
            </div>
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
