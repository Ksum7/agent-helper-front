import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Paperclip, Sparkles } from 'lucide-react';
import { chatApi } from '@/api/chat';
import { ChatMessage } from '@/components/ChatMessage';
import { ChatInput } from '@/components/ChatInput';
import { FilesPanel } from '@/components/FilesPanel';
import { useChatStream } from '@/hooks/useChatStream';
import { useToastStore } from '@/store/toast';
import type { Message } from '@/types';
import { cn, eventsToState } from '@/lib/utils';

export function ChatSessionPage() {
  const { id = '' } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const pushToast = useToastStore((s) => s.push);

  const [input, setInput] = useState('');
  const [filesOpen, setFilesOpen] = useState(false);

  const tempAssistantIdRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);

  const { data: session } = useQuery({
    queryKey: ['session', id],
    queryFn: () => chatApi.getSession(id),
    enabled: !!id,
  });

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['messages', id],
    queryFn: () => chatApi.listMessages(id),
    enabled: !!id,
  });

  const { state, start, abort, reset } = useChatStream((finalContent, events) => {
    const tempId = tempAssistantIdRef.current;
    if (tempId) {
      const contentToSave = finalContent || state.content;
      qc.setQueryData<Message[]>(['messages', id], (old: Message[] = []) =>
        old.map((m) =>
          m.id === tempId
            ? {
                ...m,
                content: contentToSave,
                events: events || [],
              }
            : m
        )
      );
    }
    qc.invalidateQueries({ queryKey: ['sessions'] });
    tempAssistantIdRef.current = null;
  });

  useEffect(() => {
    tempAssistantIdRef.current = null;
    setInput('');
    reset();
    return () => abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (state.error) pushToast(state.error, 'error');
  }, [state.error, pushToast]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottomRef.current = distance < 80;
  }

  useLayoutEffect(() => {
    if (!stickToBottomRef.current) return;
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, state.content, state.thinking, state.tools, state.isStreaming]);

  function handleSubmit() {
    const content = input.trim();
    if (!content || !id) return;

    const userMsg: Message = {
      id: `tmp_user_${Date.now()}`,
      role: 'user',
      content,
      sessionId: id,
      userId: '',
      createdAt: new Date().toISOString(),
    };

    const tempAssistantId = `tmp_assistant_${Date.now()}`;
    tempAssistantIdRef.current = tempAssistantId;

    const tempAssistantMsg: Message = {
      id: tempAssistantId,
      role: 'assistant',
      content: '',
      events: [],
      sessionId: id,
      userId: '',
      createdAt: new Date().toISOString(),
    };

    const currentMessages = qc.getQueryData<Message[]>(['messages', id]) ?? [];
    qc.setQueryData(['messages', id], [...currentMessages, userMsg, tempAssistantMsg]);

    setInput('');
    stickToBottomRef.current = true;
    start(id, content);
  }

  return (
    <div className="flex min-h-0 flex-1">
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
          <div className="min-w-0 flex-1 truncate">
            <h2 className="truncate font-medium">
              {session?.title ?? 'Загрузка…'}
            </h2>
          </div>
          <button
            onClick={() => setFilesOpen((v) => !v)}
            className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm hover:bg-bg-muted',
              filesOpen && 'bg-bg-muted',
            )}
          >
            <Paperclip className="h-4 w-4" />
            Файлы
          </button>
        </header>

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto"
        >
          <div className="mx-auto max-w-3xl">
            {isLoading ? (
              <MessagesSkeleton />
            ) : messages.length === 0 && !state.content ? (
              <EmptyState />
            ) : (
              <>
                {messages.map((m) => {
                  const isTempAssistant = m.id === tempAssistantIdRef.current;

                  let displayContent = m.content;
                  let displayThinking = '';
                  let displayTools: any[] = [];
                  let displayStreaming = false;

                  if (isTempAssistant) {
                    displayContent = state.content || m.content;
                    displayThinking = state.thinking;
                    displayTools = state.tools;
                    displayStreaming = state.isStreaming;
                  } else if (m.events) {
                    const { thinking, tools } = eventsToState(m.events);
                    displayThinking = thinking || '';
                    displayTools = tools;
                  }

                  return (
                    <ChatMessage
                      key={m.id}
                      role={m.role}
                      content={displayContent}
                      thinking={displayThinking || undefined}
                      tools={displayTools.length ? displayTools : undefined}
                      streaming={displayStreaming}
                    />
                  );
                })}
              </>
            )}
          </div>
        </div>

        <ChatInput
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          onAbort={abort}
          streaming={state.isStreaming}
        />
      </div>

      {id && (
        <FilesPanel
          sessionId={id}
          open={filesOpen}
          onClose={() => setFilesOpen(false)}
        />
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
        <Sparkles className="h-6 w-6" />
      </div>
      <h2 className="mb-1 text-xl font-semibold">Напишите что-нибудь, чтобы начать</h2>
      <p className="max-w-sm text-sm text-text-muted">
        Спросите о ваших файлах, попросите найти что-то в интернете или выполнить
        код — агент справится.
      </p>
    </div>
  );
}

function MessagesSkeleton() {
  return (
    <div className="space-y-6 p-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className={cn('flex gap-3', i % 2 ? 'justify-end' : '')}>
          <div className="h-16 w-2/3 rounded-2xl bg-bg-muted animate-pulse-soft" />
        </div>
      ))}
    </div>
  );
}