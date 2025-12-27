import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Edit, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StageLayoutProps {
  // Input section
  inputTitle: string;
  inputContent: React.ReactNode;
  
  // Output section
  outputTitle: string;
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
  
  // Output actions
  outputActions?: React.ReactNode;
  
  // Stage navigation (passed from parent)
  stageNavigation?: React.ReactNode;
}

export default function StageLayout({
  inputTitle,
  inputContent,
  outputTitle,
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
          
          {/* Input Header with Actions */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-lg">{inputTitle}</h3>
            {hasOutput && isAIGenerated && (
              <div className="flex items-center gap-1">
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
              </div>
            )}
          </div>
          
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
            <h3 className="font-medium text-lg">{outputTitle}</h3>
            {hasOutput && outputActions}
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
