# Frontend Specification — Agent Helper

> Актуально на 2026-04-30. Backend: NestJS + LangChain (Qwen3-14B через vLLM).

---

## Содержание

1. [Общие принципы](#1-общие-принципы)
2. [Аутентификация](#2-аутентификация)
3. [REST API](#3-rest-api)
4. [SSE-стриминг](#4-sse-стриминг)
5. [WebSocket (Socket.io)](#5-websocket-socketio)
6. [Файлы](#6-файлы)
7. [Модели данных](#7-модели-данных)
8. [Требования к фронтенду](#8-требования-к-фронтенду)

---

## 1. Общие принципы

### Base URL
```
http://localhost:3000
```
Конфигурируется через env `APP_PORT` (default: 3000).

### CORS
```
Разрешённый origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173'
credentials: true
```
Фронтенд должен отправлять запросы с `credentials: 'include'` (fetch) / `withCredentials: true` (axios/socket.io). Без этого cookie не передаётся.

### Content-Type
- Все JSON-запросы: `Content-Type: application/json`
- Загрузка файлов: `Content-Type: multipart/form-data` (не устанавливать вручную — браузер выставит boundary сам)

### Коды ошибок
| Статус | Ситуация |
|--------|----------|
| 400 | Ошибка валидации (Zod) — тело: `{ message: string \| string[] }` |
| 401 | Не авторизован (нет/просроченный cookie) |
| 403 | Доступ запрещён (чужой ресурс) |
| 404 | Ресурс не найден |
| 500 | Серверная ошибка |

---

## 2. Аутентификация

### Механизм
JWT хранится в **httpOnly cookie** с именем `token`.
- `sameSite: lax`, `secure: true` (только в production)
- `maxAge: 7 дней`
- Фронтенд **не имеет доступа** к токену через JS — это сделано намеренно (безопасность)
- Cookie проставляется сервером автоматически при логине/регистрации
- Cookie удаляется сервером при логауте

### POST /auth/register
Регистрация нового пользователя.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "min8chars"
}
```

**Validation:**
- `email` — валидный email
- `password` — минимум 8 символов

**Response 201:**
```json
{ "ok": true }
```
Сервер проставляет `Set-Cookie: token=<JWT>; HttpOnly; ...`

**Response 400** (ошибка валидации):
```json
{ "message": ["email: Invalid email", "password: ..."] }
```

---

### POST /auth/login

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password"
}
```

**Validation:**
- `email` — валидный email
- `password` — непустая строка

**Response 200:**
```json
{ "ok": true }
```
Сервер проставляет `Set-Cookie: token=<JWT>; HttpOnly; ...`

**Response 401:** Неверные credentials.

---

### POST /auth/logout

Запрос без тела.

**Response 200:**
```json
{ "ok": true }
```
Сервер очищает cookie.

---

### GET /auth/me

Требует аутентификации (cookie).

**Response 200:**
```json
{
  "id": "cuid...",
  "email": "user@example.com",
  "createdAt": "2026-04-30T10:00:00.000Z"
}
```

**Response 401:** Cookie отсутствует или невалиден.

---

## 3. REST API

Все эндпоинты ниже требуют аутентификации (httpOnly cookie `token`).
При отсутствии/просрочке cookie — `401 Unauthorized`.

---

### Сессии чата

#### POST /chat/sessions

Создать новую чат-сессию.

**Request:**
```json
{
  "title": "Моя сессия"
}
```

**Validation:**
- `title` — 1–255 символов

**Response 201:**
```json
{
  "id": "cuid...",
  "title": "Моя сессия",
  "userId": "cuid...",
  "createdAt": "2026-04-30T10:00:00.000Z"
}
```

---

#### GET /chat/sessions

Список всех сессий пользователя.

**Response 200:**
```json
[
  {
    "id": "cuid...",
    "title": "Моя сессия",
    "userId": "cuid...",
    "createdAt": "2026-04-30T10:00:00.000Z"
  }
]
```
Отсортировано по `createdAt` по убыванию (новые сверху).

---

#### GET /chat/sessions/:id

Получить сессию по ID.

**Response 200:** Объект `ChatSession` (см. выше).

**Response 404:** Сессия не найдена.

---

#### DELETE /chat/sessions/:id

Удалить сессию и все её сообщения (cascade).

**Response 204:** Без тела.

---

#### GET /chat/sessions/:id/messages

Список сообщений сессии.

**Response 200:**
```json
[
  {
    "id": "cuid...",
    "role": "user",
    "content": "Привет!",
    "sessionId": "cuid...",
    "userId": "cuid...",
    "createdAt": "2026-04-30T10:00:00.000Z"
  },
  {
    "id": "cuid...",
    "role": "assistant",
    "content": "Привет! Чем могу помочь?",
    "sessionId": "cuid...",
    "userId": "cuid...",
    "createdAt": "2026-04-30T10:00:01.000Z"
  }
]
```
Отсортировано по `createdAt` по возрастанию (хронологически).

- `role`: `"user"` | `"assistant"`

---

### Здоровье сервера

#### GET /health

Публичный (не требует auth).

**Response 200:**
```json
{
  "status": "ok",
  "timestamp": "2026-04-30T10:00:00.000Z"
}
```

---

## 4. SSE-стриминг

### POST /chat/sessions/:id/messages

Отправить сообщение и получить ответ ассистента потоком.

**Request:**
```json
{
  "content": "Текст сообщения пользователя"
}
```

**Validation:**
- `content` — непустая строка

**Response Headers:**
```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

### Формат событий SSE

Каждое событие: `data: <JSON>\n\n`

Поток завершается специальным маркером: `data: [DONE]\n\n`

#### Типы событий

```typescript
type StreamEvent =
  | { type: 'thinking'; content: string }   // внутренние размышления модели (можно показать в UI как collapsed)
  | { type: 'text';    content: string }   // фрагмент текстового ответа (накапливать в буфере)
  | { type: 'tool_call';   name: string; args?: unknown; id?: string }  // агент вызывает инструмент
  | { type: 'tool_result'; name: string; content: string }              // результат инструмента
  | { type: 'message'; content: string }   // финальное сообщение (уже сохранено в БД)
  | { type: 'error';   content: string }   // ошибка (поток закроется после этого)
```

#### Жизненный цикл одного запроса

```
POST /chat/sessions/:id/messages
  → сохраняется user message в БД
  → агент запускается, начинает стримить:
      [thinking events]   ← опционально, модель "думает"
      [text events]       ← накапливать для отображения в реальном времени
      [tool_call event]   ← агент вызвал инструмент
      [tool_result event] ← результат инструмента
      [text events]       ← продолжение ответа
      [message event]     ← финальный текст (сохранён в БД)
  → data: [DONE]
```

#### Пример потока

```
data: {"type":"thinking","content":"Пользователь спрашивает о погоде..."}

data: {"type":"tool_call","name":"search_web","args":{"query":"погода Москва сегодня"},"id":"call_1"}

data: {"type":"tool_result","name":"search_web","content":"Москва: +15°C, облачно..."}

data: {"type":"text","content":"Сейчас в Москве "}

data: {"type":"text","content":"+15°C, облачно."}

data: {"type":"message","content":"Сейчас в Москве +15°C, облачно."}

data: [DONE]
```

### Рекомендации по реализации SSE на фронте

```javascript
const response = await fetch(`/chat/sessions/${sessionId}/messages`, {
  method: 'POST',
  credentials: 'include',           // обязательно для cookie
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ content }),
});

const reader = response.body.getReader();
const decoder = new TextDecoder();
let buffer = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  buffer += decoder.decode(value, { stream: true });
  const lines = buffer.split('\n\n');
  buffer = lines.pop() ?? '';

  for (const line of lines) {
    if (!line.startsWith('data: ')) continue;
    const raw = line.slice(6).trim();
    if (raw === '[DONE]') { /* завершить */ continue; }

    const event = JSON.parse(raw);
    // обработать event по event.type
  }
}
```

### Доступные инструменты агента

Пользователь может увидеть в UI, что агент использует инструменты:

| `name` в `tool_call` | Что делает |
|----------------------|------------|
| `search_user_files`  | Поиск по загруженным файлам сессии (Qdrant) |
| `search_web`         | Поиск в интернете (Serper/Google) |
| `browse_url`         | Скачать и распарсить URL |
| `execute_code`       | Выполнить JS в изолированной sandbox |
| `remember_info`      | Сохранить факт в долгосрочную память |
| `recall_info`        | Найти в долгосрочной памяти |
| `forget_info`        | Удалить из памяти по ключу |

---

## 5. WebSocket (Socket.io)

Альтернативный канал стриминга — через Socket.io (можно использовать вместо SSE или параллельно).

### Подключение

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  withCredentials: true,                // передаёт cookie
  auth: { token: '<JWT>' },            // или передать JWT напрямую
});
```

> Внимание: так как cookie httpOnly, токен для `auth.token` фронтенд не имеет. Основная аутентификация — через cookie. Сервер читает токен из cookie заголовка при WebSocket handshake.

### События

#### Клиент → Сервер

**`message`** — отправить сообщение:
```typescript
socket.emit('message', {
  sessionId: string,
  content: string,
});
```

#### Сервер → Клиент

**`chunk`** — фрагмент ответа (StreamEvent):
```typescript
socket.on('chunk', (event: StreamEvent) => {
  // { type: 'thinking'|'text'|'tool_call'|'tool_result'|'message', content: string, ... }
});
```

**`done`** — стрим завершён:
```typescript
socket.on('done', () => {
  // ответ полностью получен
});
```

> Формат `StreamEvent` идентичен SSE (см. раздел 4).

---

## 6. Файлы

Все эндпоинты требуют аутентификации.

### POST /files

Загрузить файл.

**Request:** `multipart/form-data`
- Поле `file` — файл
- Query `?sessionId=<id>` — опциональная привязка к сессии (для `search_user_files`)

**Поддерживаемые форматы:**
| MIME type | Формат |
|-----------|--------|
| `text/plain` | TXT |
| `text/markdown` | MD |
| `application/pdf` | PDF |
| `application/vnd.openxmlformats-officedocument.wordprocessingml.document` | DOCX |
| `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` | XLSX |
| `application/vnd.ms-excel` | XLS |

**Response 201:**
```json
{
  "id": "cuid...",
  "filename": "document.pdf",
  "mimeType": "application/pdf",
  "minioKey": "uploads/user-id/uuid.pdf",
  "qdrantId": "uuid...",
  "sessionId": "cuid...",
  "userId": "cuid...",
  "createdAt": "2026-04-30T10:00:00.000Z"
}
```

**Пример загрузки:**
```javascript
const formData = new FormData();
formData.append('file', file);

const response = await fetch(`/files?sessionId=${sessionId}`, {
  method: 'POST',
  credentials: 'include',
  body: formData,  // НЕ устанавливать Content-Type вручную
});
```

---

### GET /files

Список всех файлов пользователя.

**Response 200:** Массив `FileRecord[]` (см. структуру выше).

---

### GET /files/:id

Скачать оригинальный файл.

**Response 200:** Бинарный поток файла.
```
Content-Type: <mimeType файла>
Content-Disposition: attachment; filename="<filename>"
```

---

### DELETE /files/:id

Удалить файл (MinIO + PostgreSQL + Qdrant).

**Response 200:** Результат удаления.

---

## 7. Модели данных

### User
```typescript
{
  id: string         // cuid
  email: string
  createdAt: string  // ISO 8601
}
```
(пароль никогда не возвращается)

### ChatSession
```typescript
{
  id: string
  title: string
  userId: string
  createdAt: string  // ISO 8601
}
```

### Message
```typescript
{
  id: string
  role: 'user' | 'assistant'
  content: string
  sessionId: string
  userId: string
  createdAt: string  // ISO 8601
}
```

### FileRecord
```typescript
{
  id: string
  filename: string
  mimeType: string
  minioKey: string
  qdrantId: string | null
  sessionId: string | null
  userId: string
  createdAt: string  // ISO 8601
}
```

---

## 8. Требования к фронтенду

### Технологии (рекомендации)

| Слой | Рекомендация | Альтернатива |
|------|-------------|--------------|
| Фреймворк | React 19 / Next.js 15 | Vue 3, SvelteKit |
| State | Zustand / Jotai | Redux Toolkit |
| HTTP | TanStack Query (react-query) | SWR |
| WebSocket | socket.io-client | native WS |
| Стили | Tailwind CSS | CSS Modules |
| UI-компоненты | shadcn/ui | Radix UI |
| Иконки | lucide-react | Heroicons |
| Рендер Markdown | react-markdown + remark-gfm | — |
| Подсветка кода | highlight.js / shiki | Prism |

---

### Страницы / Роуты

```
/               → редирект на /chat или /login
/login          → форма входа + ссылка на /register
/register       → форма регистрации
/chat           → список сессий + создание новой
/chat/:id       → активная сессия (чат + файлы)
```

---

### Функциональные требования

#### Auth
- [ ] Форма регистрации с валидацией (email + password min 8)
- [ ] Форма входа
- [ ] Кнопка выхода (POST /auth/logout)
- [ ] Защищённые роуты — редирект на /login при 401
- [ ] При старте приложения: GET /auth/me чтобы восстановить сессию
- [ ] Глобальный обработчик 401 — редирект на /login

#### Чат
- [ ] Список сессий в сайдбаре (GET /chat/sessions)
- [ ] Создать новую сессию (POST /chat/sessions)
- [ ] Удалить сессию (DELETE /chat/sessions/:id) — с подтверждением
- [ ] Загрузить историю при открытии сессии (GET /chat/sessions/:id/messages)
- [ ] Поле ввода сообщения (Enter — отправить, Shift+Enter — новая строка)
- [ ] Отображение сообщений: разделение по `role` (user справа, assistant слева)
- [ ] SSE-стриминг ответа в реальном времени (POST /chat/sessions/:id/messages)
  - Текст (`type: 'text'`) — дописывать в текущее сообщение ассистента по мере поступления
  - Мышление (`type: 'thinking'`) — опционально показывать collapsed блок "Размышление..."
  - Вызов инструмента (`type: 'tool_call'`) — показывать индикатор ("ищу в интернете...", "читаю файлы...")
  - Ошибка (`type: 'error'`) — показать toast/inline-сообщение
  - `[DONE]` — завершить стрим, разблокировать ввод
- [ ] Блокировка ввода во время стриминга
- [ ] Кнопка прервать стрим (AbortController на fetch)
- [ ] Рендер Markdown в ответах ассистента (заголовки, списки, код, таблицы)
- [ ] Code blocks с подсветкой синтаксиса и кнопкой "Копировать"
- [ ] Автоскролл вниз при новых сообщениях (с паузой если пользователь скроллит вверх)

#### Файлы
- [ ] Drag-and-drop + кнопка загрузки файла в контексте сессии
- [ ] Показывать поддерживаемые форматы (PDF, DOCX, XLSX, TXT, MD)
- [ ] Прогресс загрузки
- [ ] Список файлов сессии (GET /files + фильтр по sessionId)
- [ ] Скачать файл (GET /files/:id)
- [ ] Удалить файл (DELETE /files/:id) — с подтверждением
- [ ] Показывать индикатор, когда агент использует `search_user_files`

---

### Нефункциональные требования

#### UX
- [ ] Оптимистичный UI для отправки сообщений (добавить user-сообщение в список сразу, не ждать сервера)
- [ ] Skeleton-загрузка при первом рендере списка сообщений
- [ ] Toast-уведомления для ошибок (валидация, 500, проблемы с сетью)
- [ ] Пустое состояние для нового чата ("Напишите что-нибудь, чтобы начать")
- [ ] Мобильная адаптация: сайдбар убирается в drawer на маленьких экранах

#### Производительность
- [ ] Виртуализация списка сообщений при длинных историях (react-virtual / tanstack-virtual)
- [ ] Дебаунс на обновление состояния во время стриминга (чтобы не перерисовывать на каждый чанк)
- [ ] Мемоизация сообщений (React.memo / useMemo)

#### Обработка ошибок SSE
```javascript
// Если соединение разорвалось до [DONE] — показать ошибку
// Если event.type === 'error' — показать content как сообщение об ошибке
// AbortController: при unmount компонента или нажатии "Стоп"
```

---

### Переменные окружения (фронтенд)

```env
VITE_API_URL=http://localhost:3000      # или NEXT_PUBLIC_API_URL
VITE_WS_URL=http://localhost:3000       # для Socket.io
```

---

### Типы TypeScript для фронта

```typescript
// Базовые модели
interface User {
  id: string;
  email: string;
  createdAt: string;
}

interface ChatSession {
  id: string;
  title: string;
  userId: string;
  createdAt: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sessionId: string;
  userId: string;
  createdAt: string;
}

interface FileRecord {
  id: string;
  filename: string;
  mimeType: string;
  minioKey: string;
  qdrantId: string | null;
  sessionId: string | null;
  userId: string;
  createdAt: string;
}

// SSE события
type StreamEvent =
  | { type: 'thinking'; content: string }
  | { type: 'text'; content: string }
  | { type: 'tool_call'; name: string; args?: unknown; id?: string }
  | { type: 'tool_result'; name: string; content: string }
  | { type: 'message'; content: string }
  | { type: 'error'; content: string };

// Инструменты агента
type ToolName =
  | 'search_user_files'
  | 'search_web'
  | 'browse_url'
  | 'execute_code'
  | 'remember_info'
  | 'recall_info'
  | 'forget_info';

// Состояние стриминга в UI
interface StreamingMessage {
  id: string;           // временный id для UI
  role: 'assistant';
  content: string;      // накапливается из text events
  thinking: string;     // накапливается из thinking events
  activeTool: ToolName | null;  // текущий инструмент
  isDone: boolean;
}
```

---

### Диаграмма потока чата

```
Пользователь вводит сообщение
        ↓
Добавить в UI (оптимистично)
        ↓
POST /chat/sessions/:id/messages
        ↓
ReadableStream → парсить SSE чанки
        ↓
  type: 'thinking'  → collapsed блок
  type: 'text'      → дописывать в сообщение
  type: 'tool_call' → показать индикатор инструмента
  type: 'tool_result' → скрыть индикатор
  type: 'message'   → финальный текст (replace streaming content)
  type: 'error'     → показать ошибку
        ↓
data: [DONE] → разблокировать ввод
```

---

*Документ сгенерирован по исходному коду backend. При изменении API — обновить этот файл.*
