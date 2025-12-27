import React, { useState } from 'react';
import { Copy, Check, Download, Clock, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ScriptViewerProps {
  scriptContent: string;
  metadata?: {
    script_type?: string;
    estimated_reading_duration?: number;
    actual_char_count?: number;
  };
  title?: string;
}

export const ScriptViewer: React.FC<ScriptViewerProps> = ({ scriptContent, metadata, title }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(scriptContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([scriptContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'script'}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      {/* Metadata header */}
      {metadata && (
        <div className="flex items-center gap-3 px-4 py-3 border-b bg-muted/30">
          {metadata.script_type && (
            <Badge variant="secondary" className="capitalize">
              <FileText className="h-3 w-3 mr-1" />
              {metadata.script_type}
            </Badge>
          )}
          {metadata.estimated_reading_duration && (
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              ~{formatDuration(metadata.estimated_reading_duration)}
            </span>
          )}
          {metadata.actual_char_count && (
            <span className="text-sm text-muted-foreground">
              {metadata.actual_char_count.toLocaleString()} chars
            </span>
          )}
        </div>
      )}

      {/* Script content */}
      <div className="p-4 max-h-[400px] overflow-y-auto">
        <pre className="text-sm whitespace-pre-wrap font-mono text-foreground leading-relaxed">
          {scriptContent}
        </pre>
      </div>

      {/* Actions footer */}
      <div className="flex items-center gap-2 px-4 py-3 border-t bg-muted/30">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="gap-2"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy Script
            </>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Download .txt
        </Button>
      </div>
    </div>
  );
};
