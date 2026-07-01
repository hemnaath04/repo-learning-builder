import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import type { RepoNode } from '../lib/schema';
import { Mermaid } from './Mermaid';
import { TechCards } from './TechCards';
import { Icon } from './Icon';

function ImportanceDots({ n }: { n?: number }) {
  const count = Math.max(0, Math.min(3, n ?? 0));
  if (!count) return null;
  return (
    <span className="tree-imp" aria-label={`importance ${count} of 3`}>
      {Array.from({ length: count }).map((_, i) => <i key={i} />)}
    </span>
  );
}

function Tree({ node, onSelect, selected }: { node: RepoNode; onSelect: (n: RepoNode) => void; selected?: string }) {
  return (
    <li className="tree-node">
      <button className={`tree-row${selected === node.path ? ' selected' : ''}`} onClick={() => onSelect(node)}>
        <Icon name={node.kind === 'dir' ? 'FolderTree' : 'FileCode'} size={14} />
        <span className="tree-name">{node.name}</span>
        {node.role && <span className="tree-role">{node.role}</span>}
        <ImportanceDots n={node.importance} />
      </button>
      {node.children && node.children.length > 0 && (
        <ul className="tree-children">
          {node.children.map((c) => <Tree key={c.path} node={c} onSelect={onSelect} selected={selected} />)}
        </ul>
      )}
    </li>
  );
}

export function ExplorerPage() {
  const { course, navigate } = useApp();
  const [selected, setSelected] = useState<RepoNode | null>(null);

  const archDiagram = useMemo(
    () => course.diagrams.find((d) => /arch|system|map/i.test(d.id) || /arch|system/i.test(d.title)) ?? course.diagrams[0],
    [course.diagrams],
  );

  const relatedLessons = useMemo(() => {
    if (!selected) return [];
    return course.modules
      .flatMap((m) => m.lessons)
      .filter((l) => (l.sources ?? []).some((s) => s.path === selected.path || s.path.startsWith(selected.path + '/')))
      .map((l) => ({ id: l.id, title: l.title }));
  }, [selected, course]);

  if (!course.repoMap && course.diagrams.length === 0) {
    return (
      <div className="empty">
        <Icon name="FolderTree" size={28} className="empty-icon" />
        <p>This course is not based on a repository, so there is no explorer.</p>
      </div>
    );
  }

  return (
    <div className="explorer reveal">
      <h1><Icon name="FolderTree" size={22} /> Repository explorer</h1>

      {archDiagram && (
        <section className="lesson-section">
          <h2><Icon name="Network" size={18} /> Architecture map</h2>
          <Mermaid code={archDiagram.code} title={archDiagram.title} />
        </section>
      )}

      {course.repoMap && (
        <section className="lesson-section">
          <h2><Icon name="Map" size={18} /> Directory map</h2>
          <p className="muted">Dots mark the files that matter most. Select anything to learn what it does.</p>
          <div className="explorer-grid">
            <ul className="tree">
              <Tree node={course.repoMap} onSelect={setSelected} selected={selected?.path} />
            </ul>
            <div className="component-panel">
              {selected ? (
                <>
                  <h3><Icon name={selected.kind === 'dir' ? 'FolderTree' : 'FileCode'} size={16} /> {selected.name}</h3>
                  <dl>
                    <dt>Path</dt>
                    <dd><code>{selected.path}</code></dd>
                    {selected.role && (<><dt>What it does</dt><dd>{selected.role}</dd></>)}
                    {typeof selected.importance === 'number' && (<><dt>Importance</dt><dd>{selected.importance} / 3</dd></>)}
                    {selected.children && selected.children.length > 0 && (
                      <><dt>Contains</dt><dd>{selected.children.map((c) => c.name).join(', ')}</dd></>
                    )}
                    <dt>Related lessons</dt>
                    <dd>
                      {relatedLessons.length === 0 ? (
                        <span className="muted">None cite this path directly.</span>
                      ) : (
                        <ul style={{ margin: 0, paddingLeft: '1rem' }}>
                          {relatedLessons.map((l) => (
                            <li key={l.id}>
                              <button className="link" onClick={() => navigate({ name: 'lesson', lessonId: l.id })}>{l.title}</button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </dd>
                  </dl>
                </>
              ) : (
                <p className="muted">Select a file or folder to see what it does, why it exists, and which lessons cover it.</p>
              )}
            </div>
          </div>
        </section>
      )}

      {course.tech.length > 0 && (
        <section className="lesson-section">
          <h2><Icon name="Cpu" size={18} /> Technology cards</h2>
          <TechCards tech={course.tech} />
        </section>
      )}
    </div>
  );
}
