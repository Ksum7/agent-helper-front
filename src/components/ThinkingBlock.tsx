import { useState } from 'react';
import { Brain, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ThinkingBlock({
  content,
  active,
}: {
  content: string;
  active?: boolean;
}) {
  const [open, setOpen] = useState(false);
  if (!content.trim()) return null;
  return (
    <div className="rounded-lg border border-border-subtle bg-bg-subtle text-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-bg-muted/40"
      >
        <Brain
          className={cn(
            'h-3.5 w-3.5 text-text-muted',
            active && 'animate-pulse-soft text-accent',
          )}
        />
        <span className="font-medium">Размышление</span>
        <span className="ml-auto text-text-subtle">
          {open ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </span>
      </button>
      {open && (
        <div className="border-t border-border-subtle px-3 py-2 text-xs italic text-text-muted whitespace-pre-wrap">
          {content}
        </div>
      )}
    </div>
  );
}
