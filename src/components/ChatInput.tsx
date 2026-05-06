import { useEffect, useRef, type KeyboardEvent } from 'react';
import { ArrowUp, Square } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onAbort?: () => void;
  streaming?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  onAbort,
  streaming,
  disabled,
  placeholder = 'Сообщение агенту…',
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  }, [value]);

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!streaming && value.trim()) onSubmit();
    }
  }

  const canSend = !!value.trim() && !disabled && !streaming;

  return (
    <div className="border-t border-border bg-bg">
      <div className="mx-auto max-w-3xl px-4 py-3">
        <div
          className={cn(
            'flex items-end gap-2 rounded-2xl border border-border bg-bg px-3 py-2 shadow-sm transition-shadow focus-within:border-accent/40 focus-within:shadow-md',
            disabled && 'opacity-60',
          )}
        >
          <textarea
            ref={ref}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="max-h-[200px] flex-1 resize-none bg-transparent py-1.5 text-[15px] outline-none placeholder:text-text-subtle"
          />
          {streaming ? (
            <button
              onClick={onAbort}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-text text-white transition hover:bg-text/80"
              title="Остановить"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
            </button>
          ) : (
            <button
              onClick={() => canSend && onSubmit()}
              disabled={!canSend}
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition',
                canSend
                  ? 'bg-accent text-white hover:bg-accent-hover'
                  : 'bg-bg-muted text-text-subtle',
              )}
              title="Отправить (Enter)"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          )}
        </div>
        <p className="mt-1.5 text-center text-xs text-text-subtle">
          Enter — отправить · Shift+Enter — новая строка
        </p>
      </div>
    </div>
  );
}
