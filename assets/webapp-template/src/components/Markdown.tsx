import { renderMarkdown } from '../lib/markdown';

export function Markdown({ text, className }: { text?: string; className?: string }) {
  if (!text) return null;
  return (
    <div
      className={className ? `md ${className}` : 'md'}
      dangerouslySetInnerHTML={{ __html: renderMarkdown(text) }}
    />
  );
}
