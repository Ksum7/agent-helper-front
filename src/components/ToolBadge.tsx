import {
  BookmarkPlus,
  BookmarkMinus,
  Brain,
  ChevronDown,
  ChevronRight,
  Code2,
  FileSearch,
  Globe,
  Link as LinkIcon,
  Loader2,
  Search,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { ToolCallState } from '@/types';

const TOOL_META: Record<
  string,
  { label: string; activeLabel: string; icon: React.ComponentType<{ className?: string }> }
> = {
  search_user_files: {
    label: 'Поиск по файлам',
    activeLabel: 'Ищу в ваших файлах',
    icon: FileSearch,
  },
  search_web: {
    label: 'Поиск в интернете',
    activeLabel: 'Ищу в интернете',
    icon: Globe,
  },
  browse_url: {
    label: 'Открытие URL',
    activeLabel: 'Читаю страницу',
    icon: LinkIcon,
  },
  execute_code: {
    label: 'Выполнение кода',
    activeLabel: 'Выполняю код',
    icon: Code2,
  },
  remember_info: {
    label: 'Сохранение в память',
    activeLabel: 'Сохраняю в память',
    icon: BookmarkPlus,
  },
  recall_info: {
    label: 'Поиск в памяти',
    activeLabel: 'Ищу в памяти',
    icon: Search,
  },
  forget_info: {
    label: 'Удаление из памяти',
    activeLabel: 'Удаляю из памяти',
    icon: BookmarkMinus,
  },
};

const FALLBACK = { label: 'Инструмент', activeLabel: 'Использую инструмент', icon: Brain };

export function ToolBadge({ tool }: { tool: ToolCallState }) {
  const [open, setOpen] = useState(false);
  const meta = TOOL_META[tool.name] ?? FALLBACK;
  const Icon = meta.icon;
  const hasDetails = tool.args !== undefined || tool.result !== undefined;

  return (
    <div
      className={cn(
        'rounded-lg border border-border-subtle bg-bg-subtle text-sm',
        !tool.done && 'border-accent/30 bg-accent/5',
      )}
    >
      <button
        type="button"
        onClick={() => hasDetails && setOpen((v) => !v)}
        className={cn(
          'flex w-full items-center gap-2 px-3 py-2 text-left',
          hasDetails && 'cursor-pointer hover:bg-bg-muted/40',
        )}
      >
        {!tool.done ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
        ) : (
          <Icon className="h-3.5 w-3.5 text-text-muted" />
        )}
        <span className="font-medium">
          {tool.done ? meta.label : meta.activeLabel + '…'}
        </span>
        {hasDetails && (
          <span className="ml-auto text-text-subtle">
            {open ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </span>
        )}
      </button>
      {open && hasDetails && (
        <div className="border-t border-border-subtle px-3 py-2 text-xs text-text-muted">
          {tool.args !== undefined && (
            <div className="mb-2">
              <div className="mb-1 font-medium text-text">Аргументы</div>
              <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded bg-white p-2 font-mono text-[11px]">
                {typeof tool.args === 'string'
                  ? tool.args
                  : JSON.stringify(tool.args, null, 2)}
              </pre>
            </div>
          )}
          {tool.result !== undefined && (
            <div>
              <div className="mb-1 font-medium text-text">Результат</div>
              <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words rounded bg-white p-2 font-mono text-[11px]">
                {tool.result}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
