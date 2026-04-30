import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Bot, Loader2, MessageSquarePlus } from 'lucide-react';
import { chatApi } from '@/api/chat';
import { Button } from '@/components/ui/Button';
import { useToastStore } from '@/store/toast';

export function ChatHome() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const pushToast = useToastStore((s) => s.push);

  const create = useMutation({
    mutationFn: () => chatApi.createSession('Новый чат'),
    onSuccess: (s) => {
      qc.invalidateQueries({ queryKey: ['sessions'] });
      navigate(`/chat/${s.id}`);
    },
    onError: (e) => pushToast((e as Error).message, 'error'),
  });

  return (
    <div className="flex flex-1 items-center justify-center bg-bg-subtle/40 px-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-white">
          <Bot className="h-7 w-7" />
        </div>
        <h1 className="mb-2 text-2xl font-semibold">Чем могу помочь?</h1>
        <p className="mb-6 text-text-muted">
          Создайте новый чат или выберите существующий из списка слева. Агент
          может искать в интернете, работать с вашими файлами и запоминать факты.
        </p>
        <Button
          onClick={() => create.mutate()}
          disabled={create.isPending}
          size="lg"
        >
          {create.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MessageSquarePlus className="h-4 w-4" />
          )}
          Новый чат
        </Button>
      </div>
    </div>
  );
}
