import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useToastStore, type ToastVariant } from '@/store/toast';
import { cn } from '@/lib/utils';

const styles: Record<ToastVariant, string> = {
  info: 'bg-bg border-border text-text',
  success: 'bg-bg border-accent/30 text-text',
  error: 'bg-bg border-red-500/30 text-text',
};

const icons: Record<ToastVariant, React.ReactNode> = {
  info: <Info className="h-4 w-4 text-text-muted" />,
  success: <CheckCircle2 className="h-4 w-4 text-accent" />,
  error: <XCircle className="h-4 w-4 text-red-500" />,
};

export function Toaster() {
  const { toasts, dismiss } = useToastStore();
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'pointer-events-auto flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm shadow-md animate-slide-up',
            styles[t.variant],
          )}
        >
          <div className="mt-0.5">{icons[t.variant]}</div>
          <div className="flex-1">{t.message}</div>
          <button
            onClick={() => dismiss(t.id)}
            className="text-text-subtle hover:text-text"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
