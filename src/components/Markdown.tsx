import { memo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  content: string;
  className?: string;
}

export const Markdown = memo(function Markdown({ content, className }: Props) {
  return (
    <div className={cn('markdown-body', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeHighlight, { detect: true, ignoreMissing: true }]]}
        components={{
          pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
          code: ({ className, children, ...rest }) => (
            <code className={className} {...rest}>
              {children}
            </code>
          ),
          a: (props) => (
            <a
              {...props}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline-offset-2 hover:underline"
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});

function CodeBlock({ children }: { children: React.ReactNode }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    const text = extractText(children);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="group relative my-3 overflow-hidden rounded-lg border border-border bg-[#0d1117]">
      <button
        onClick={handleCopy}
        className="absolute right-2 top-2 z-10 hidden items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-xs text-white/80 backdrop-blur transition hover:bg-white/20 group-hover:flex"
      >
        {copied ? (
          <>
            <Check className="h-3 w-3" /> Скопировано
          </>
        ) : (
          <>
            <Copy className="h-3 w-3" /> Копировать
          </>
        )}
      </button>
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed text-white">
        {children}
      </pre>
    </div>
  );
}

function extractText(node: React.ReactNode): string {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (node && typeof node === 'object' && 'props' in node) {
    const props = (node as { props: { children?: React.ReactNode } }).props;
    return extractText(props.children);
  }
  return '';
}
