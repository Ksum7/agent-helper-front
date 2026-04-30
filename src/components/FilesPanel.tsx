import { useRef, useState, type DragEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Download,
  File as FileIcon,
  FileSpreadsheet,
  FileText,
  Loader2,
  Paperclip,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { filesApi } from '@/api/files';
import { useToastStore } from '@/store/toast';
import { cn } from '@/lib/utils';
import type { FileRecord } from '@/types';

const ACCEPTED =
  '.pdf,.docx,.xlsx,.xls,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/plain,text/markdown';

const MIME_LABELS: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  'application/pdf': { label: 'PDF', icon: FileText },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
    label: 'DOCX',
    icon: FileText,
  },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
    label: 'XLSX',
    icon: FileSpreadsheet,
  },
  'application/vnd.ms-excel': { label: 'XLS', icon: FileSpreadsheet },
  'text/plain': { label: 'TXT', icon: FileText },
  'text/markdown': { label: 'MD', icon: FileText },
};

interface Props {
  sessionId: string;
  open: boolean;
  onClose: () => void;
}

export function FilesPanel({ sessionId, open, onClose }: Props) {
  const qc = useQueryClient();
  const pushToast = useToastStore((s) => s.push);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const { data: allFiles = [], isLoading } = useQuery({
    queryKey: ['files'],
    queryFn: filesApi.list,
  });

  const sessionFiles = allFiles.filter((f) => f.sessionId === sessionId);

  const upload = useMutation({
    mutationFn: (file: File) => filesApi.upload(file, sessionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['files'] });
      pushToast('Файл загружен', 'success');
    },
    onError: (e) => pushToast((e as Error).message, 'error'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => filesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['files'] });
    },
    onError: (e) => pushToast((e as Error).message, 'error'),
  });

  function handleFiles(files: FileList | null) {
    if (!files) return;
    Array.from(files).forEach((f) => upload.mutate(f));
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 right-0 z-40 flex w-80 flex-col border-l border-border bg-white transition-transform lg:static lg:translate-x-0',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-2">
            <Paperclip className="h-4 w-4 text-text-muted" />
            <h3 className="font-medium">Файлы сессии</h3>
            <span className="rounded-full bg-bg-muted px-2 py-0.5 text-xs text-text-muted">
              {sessionFiles.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-text-muted hover:bg-bg-muted lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED}
            multiple
            className="hidden"
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = '';
            }}
          />
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={cn(
              'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-bg-subtle px-4 py-6 text-center text-sm transition',
              dragOver && 'border-accent bg-accent/5',
            )}
          >
            {upload.isPending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-accent" />
                <span className="text-text-muted">Загрузка…</span>
              </>
            ) : (
              <>
                <Upload className="h-5 w-5 text-text-muted" />
                <span className="font-medium">Перетащите или нажмите</span>
                <span className="text-xs text-text-subtle">
                  PDF, DOCX, XLSX, TXT, MD
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-14 rounded-lg bg-bg-muted animate-pulse-soft"
                />
              ))}
            </div>
          ) : sessionFiles.length === 0 ? (
            <div className="rounded-lg bg-bg-subtle p-4 text-center text-xs text-text-muted">
              Файлы для этой сессии не загружены. Они будут доступны агенту через
              инструмент <span className="font-mono">search_user_files</span>.
            </div>
          ) : (
            <ul className="space-y-2">
              {sessionFiles.map((f) => (
                <FileItem key={f.id} file={f} onDelete={() => remove.mutate(f.id)} />
              ))}
            </ul>
          )}
        </div>
      </aside>
    </>
  );
}

function FileItem({ file, onDelete }: { file: FileRecord; onDelete: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const meta = MIME_LABELS[file.mimeType] ?? { label: '?', icon: FileIcon };
  const Icon = meta.icon;
  return (
    <li className="group flex items-center gap-2 rounded-lg border border-border-subtle bg-white p-2 transition hover:border-border">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-bg-subtle">
        <Icon className="h-4 w-4 text-text-muted" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium" title={file.filename}>
          {file.filename}
        </div>
        <div className="text-xs text-text-subtle">{meta.label}</div>
      </div>
      <a
        href={filesApi.downloadUrl(file.id)}
        target="_blank"
        rel="noreferrer"
        className="rounded p-1.5 text-text-muted hover:bg-bg-muted hover:text-text"
        title="Скачать"
      >
        <Download className="h-3.5 w-3.5" />
      </a>
      {confirming ? (
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              onDelete();
              setConfirming(false);
            }}
            className="rounded p-1.5 text-red-500 hover:bg-red-50"
            title="Подтвердить"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="rounded p-1.5 text-text-muted hover:bg-bg-muted"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className="rounded p-1.5 text-text-muted hover:bg-bg-muted hover:text-red-500"
          title="Удалить"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </li>
  );
}
