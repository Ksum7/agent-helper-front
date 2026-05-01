import { useCallback, useRef, useState } from "react";
import { streamMessage } from "@/lib/stream";
import type { StreamEvent, ToolCallState } from "@/types";

export interface StreamState {
  thinking: string;
  content: string;
  tools: ToolCallState[];
  isStreaming: boolean;
  error: string | null;
  events: StreamEvent[];
}

const initial: StreamState = {
  thinking: "",
  content: "",
  tools: [],
  isStreaming: false,
  error: null,
  events: [],
};

export function useChatStream(
  onComplete: (finalContent: string, events: StreamEvent[]) => void,
) {
  const [state, setState] = useState<StreamState>(initial);
  const abortRef = useRef<AbortController | null>(null);
  const finalContentRef = useRef<string>("");
  const eventsRef = useRef<StreamEvent[]>([]);

  const reset = useCallback(() => {
    setState(initial);
    finalContentRef.current = "";
    eventsRef.current = [];
  }, []);

  const start = useCallback(
    (sessionId: string, content: string) => {
      const controller = new AbortController();
      abortRef.current = controller;
      finalContentRef.current = "";
      eventsRef.current = [];
      setState({ ...initial, isStreaming: true });

      streamMessage(sessionId, content, {
        signal: controller.signal,
        onEvent: (event: StreamEvent) => {
          if (
            event.type === "thinking" ||
            event.type === "tool_call" ||
            event.type === "tool_result"
          ) {
            eventsRef.current.push(event);
          }

          setState((prev) => {
            switch (event.type) {
              case "thinking":
                return { ...prev, thinking: prev.thinking + event.content };
              case "text":
                return { ...prev, content: prev.content + event.content };
              case "tool_call": {
                const id =
                  event.id ?? `tool_${prev.tools.length}_${event.name}`;
                return {
                  ...prev,
                  tools: [
                    ...prev.tools,
                    { id, name: event.name, args: event.args, done: false },
                  ],
                };
              }
              case "tool_result": {
                const tools = [...prev.tools];
                for (let i = tools.length - 1; i >= 0; i--) {
                  if (tools[i].name === event.name && !tools[i].done) {
                    tools[i] = {
                      ...tools[i],
                      result: event.content,
                      done: true,
                    };
                    return { ...prev, tools };
                  }
                }
                tools.push({
                  id: `tool_${tools.length}_${event.name}`,
                  name: event.name,
                  result: event.content,
                  done: true,
                });
                return { ...prev, tools };
              }
              case "message":
                finalContentRef.current = event.content;
                return { ...prev, content: event.content };
              case "error":
                return { ...prev, error: event.content };
              default:
                return prev;
            }
          });
        },
        onDone: () => {
          setState((prev) => {
            const finalContent = finalContentRef.current || prev.content;
            const events = [...eventsRef.current];

            onComplete(finalContent, events);

            return {
              ...prev,
              isStreaming: false,
              content: finalContent,
              events,
            };
          });
        },
        onError: (err) => {
          setState((prev) => ({
            ...prev,
            isStreaming: false,
            error: err.message,
          }));
        },
      });
    },
    [onComplete],
  );

  const abort = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setState((prev) => ({ ...prev, isStreaming: false }));
  }, []);

  return { state, start, abort, reset };
}
