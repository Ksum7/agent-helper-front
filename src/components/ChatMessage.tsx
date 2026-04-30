import { memo } from 'react';
import { Bot, User as UserIcon } from 'lucide-react';
import { Markdown } from './Markdown';
import { ToolBadge } from './ToolBadge';
import { ThinkingBlock } from './ThinkingBlock';
import { cn } from '@/lib/utils';
import type { Role, ToolCallState } from '@/types';

interface ChatMessageProps {
  role: Role;
  content: string;
  thinking?: string;
  tools?: ToolCallState[];
  streaming?: boolean;
}

function MessageInner({
  role,
  content,
  thinking,
  tools,
  streaming,
}: ChatMessageProps) {
  const isUser = role === 'user';

  return (
    <div
      className={cn(
        'group flex gap-3 px-4 py-5 animate-fade-in',
        isUser ? 'justify-end' : 'justify-start',
      )}
    >
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-white">
          <Bot className="h-4 w-4" />
        </div>
      )}

      <div
        className={cn(
          'flex max-w-[min(46rem,calc(100%-3rem))] flex-col gap-2',
          isUser ? 'items-end' : 'items-start',
        )}
      >
        {!isUser && thinking && (
          <ThinkingBlock content={thinking} active={streaming && !content} />
        )}

        {!isUser && tools && tools.length > 0 && (
          <div className="flex w-full flex-col gap-1.5">
            {tools.map((t) => (
              <ToolBadge key={t.id} tool={t} />
            ))}
          </div>
        )}

        {(content || (!isUser && streaming && !tools?.length && !thinking)) && (
          <div
            className={cn(
              'rounded-2xl px-4 py-3 text-[15px] leading-relaxed',
              isUser
                ? 'bg-accent text-white'
                : 'bg-bg-subtle text-text border border-border-subtle',
            )}
          >
            {isUser ? (
              <div className="whitespace-pre-wrap break-words">{content}</div>
            ) : content ? (
              <Markdown content={content} />
            ) : (
              <div className="flex items-center gap-1.5 text-text-muted">
                <span className="inline-block h-1.5 w-1.5 animate-pulse-soft rounded-full bg-text-muted" />
                <span
                  className="inline-block h-1.5 w-1.5 animate-pulse-soft rounded-full bg-text-muted"
                  style={{ animationDelay: '0.2s' }}
                />
                <span
                  className="inline-block h-1.5 w-1.5 animate-pulse-soft rounded-full bg-text-muted"
                  style={{ animationDelay: '0.4s' }}
                />
              </div>
            )}
            {!isUser && streaming && content && (
              <span className="ml-0.5 inline-block h-4 w-0.5 translate-y-0.5 animate-pulse-soft bg-text" />
            )}
          </div>
        )}
      </div>

      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bg-muted text-text">
          <UserIcon className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}

export const ChatMessage = memo(MessageInner);
