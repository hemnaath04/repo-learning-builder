import type { ReactNode } from 'react';

export function Disclosure({
  summary,
  children,
  defaultOpen = false,
}: {
  summary: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details className="disclosure" open={defaultOpen}>
      <summary>{summary}</summary>
      <div className="disclosure-body">{children}</div>
    </details>
  );
}
