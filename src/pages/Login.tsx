import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bot, Loader2 } from 'lucide-react';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/auth';
import { useToastStore } from '@/store/toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ApiError } from '@/lib/api';

export function LoginPage() {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const pushToast = useToastStore((s) => s.push);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await authApi.login(email, password);
      const user = await authApi.me();
      setUser(user);
      navigate('/chat', { replace: true });
    } catch (err) {
      const msg =
        err instanceof ApiError && err.status === 401
          ? 'Неверный email или пароль'
          : (err as Error).message;
      setError(msg);
      pushToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-subtle px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-white">
            <Bot className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold">Agent Helper</h1>
          <p className="text-sm text-text-muted">Войдите в свой аккаунт</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-border bg-white p-6 shadow-sm"
        >
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Пароль</label>
            <Input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          <Button type="submit" disabled={loading} className="w-full" size="lg">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Войти
          </Button>
          <p className="text-center text-sm text-text-muted">
            Нет аккаунта?{' '}
            <Link to="/register" className="font-medium text-accent hover:underline">
              Зарегистрироваться
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
