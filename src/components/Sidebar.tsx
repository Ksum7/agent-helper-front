import { useState } from 'react';
import { Link, NavLink, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bot,
  LogOut,
  MessageSquarePlus,
  MessageSquare,
  Trash2,
  X,
  Loader2,
} from 'lucide-react';
import { chatApi } from '@/api/chat';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/auth';
import { useToastStore } from '@/store/toast';
import { cn, formatDate } from '@/lib/utils';
import type { ChatSession } from '@/types';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const pushToast = useToastStore((s) => s.push);

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: chatApi.listSessions,
  });

  const createSession = useMutation({
    mutationFn: () => chatApi.createSession('Новый чат'),
    onSuccess: (s) => {
      qc.invalidateQueries({ queryKey: ['sessions'] });
      navigate(`/chat/${s.id}`);
      onClose();
    },
    onError: (e) => pushToast((e as Error).message, 'error'),
  });

  const deleteSession = useMutation({
    mutationFn: (id: string) => chatApi.deleteSession(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['sessions'] });
      if (params.id === id) navigate('/chat');
    },
    onError: (e) => pushToast((e as Error).message, 'error'),
  });

  async function handleLogout() {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    setUser(null);
    qc.clear();
    navigate('/login', { replace: true });
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
          'fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-sidebar text-white transition-transform lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <Link to="/chat" className="flex items-center gap-2 font-semibold">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
              <Bot className="h-4 w-4 text-white" />
            </div>
            Agent Helper
          </Link>
          <button
            className="rounded-md p-1 text-white/60 hover:bg-white/10 lg:hidden"
            onClick={onClose}
            aria-label="Закрыть"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-3">
          <button
            onClick={() => createSession.mutate()}
            disabled={createSession.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-50"
          >
            {createSession.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MessageSquarePlus className="h-4 w-4" />
            )}
            Новый чат
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {isLoading ? (
            <SidebarSkeleton />
          ) : sessions.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-white/40">
              Чатов пока нет
            </div>
          ) : (
            <ul className="space-y-0.5">
              {sessions.map((s) => (
                <SessionItem
                  key={s.id}
                  session={s}
                  onDelete={() => deleteSession.mutate(s.id)}
                  onClick={onClose}
                />
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-1.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-medium">
              {user?.email?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{user?.email}</div>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-md p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
              title="Выйти"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

function SessionItem({
  session,
  onDelete,
  onClick,
}: {
  session: ChatSession;
  onDelete: () => void;
  onClick: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  return (
    <li>
      <NavLink
        to={`/chat/${session.id}`}
        onClick={onClick}
        className={({ isActive }) =>
          cn(
            'group flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/80 transition-colors hover:bg-white/10',
            isActive && 'bg-white/15 text-white',
          )
        }
      >
        <MessageSquare className="h-4 w-4 shrink-0 opacity-60" />
        <div className="min-w-0 flex-1">
          <div className="truncate">{session.title}</div>
          <div className="text-xs text-white/40">
            {formatDate(session.createdAt)}
          </div>
        </div>
        {confirming ? (
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.preventDefault();
                onDelete();
                setConfirming(false);
              }}
              className="rounded p-1 text-red-400 hover:bg-red-500/20"
              title="Подтвердить"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                setConfirming(false);
              }}
              className="rounded p-1 text-white/60 hover:bg-white/10"
              title="Отмена"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={(e) => {
              e.preventDefault();
              setConfirming(true);
            }}
            className="hidden rounded p-1 text-white/40 hover:bg-white/10 hover:text-white group-hover:block"
            title="Удалить"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </NavLink>
    </li>
  );
}

function SidebarSkeleton() {
  return (
    <div className="space-y-1 px-1 py-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-12 rounded-lg bg-white/5 animate-pulse-soft"
        />
      ))}
    </div>
  );
}
