// Tiny, dependency-free Markdown to HTML for a safe subset. Everything is HTML
// escaped first, so the output is safe to inject. Supports headings, bold,
// italic, inline code, fenced code, links, unordered/ordered lists, and
// paragraphs. Keeps the template free of a heavy Markdown dependency.

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function inline(s: string): string {
  return s
    .replace(/`([^`]+)`/g, (_m, c) => `<code>${c}</code>`)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
    .replace(
      /\[([^\]]+)\]\((https?:[^)\s]+)\)/g,
      '<a href="$2" rel="noopener noreferrer" target="_blank">$1</a>',
    );
}

export function renderMarkdown(md: string | undefined): string {
  if (!md) return '';
  const lines = escapeHtml(md).split('\n');
  const out: string[] = [];
  let i = 0;
  let listType: 'ul' | 'ol' | null = null;

  const closeList = () => {
    if (listType) {
      out.push(`</${listType}>`);
      listType = null;
    }
  };

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block.
    if (/^```/.test(line.trim())) {
      closeList();
      const buf: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i].trim())) {
        buf.push(lines[i]);
        i++;
      }
      i++; // skip closing fence
      out.push(`<pre><code>${buf.join('\n')}</code></pre>`);
      continue;
    }

    // Headings.
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      closeList();
      const level = h[1].length;
      out.push(`<h${level}>${inline(h[2])}</h${level}>`);
      i++;
      continue;
    }

    // Unordered list.
    if (/^\s*[-*]\s+/.test(line)) {
      if (listType !== 'ul') {
        closeList();
        listType = 'ul';
        out.push('<ul>');
      }
      out.push(`<li>${inline(line.replace(/^\s*[-*]\s+/, ''))}</li>`);
      i++;
      continue;
    }

    // Ordered list.
    if (/^\s*\d+\.\s+/.test(line)) {
      if (listType !== 'ol') {
        closeList();
        listType = 'ol';
        out.push('<ol>');
      }
      out.push(`<li>${inline(line.replace(/^\s*\d+\.\s+/, ''))}</li>`);
      i++;
      continue;
    }

    // Blank line.
    if (line.trim() === '') {
      closeList();
      i++;
      continue;
    }

    // Paragraph.
    closeList();
    out.push(`<p>${inline(line)}</p>`);
    i++;
  }
  closeList();
  return out.join('\n');
}
