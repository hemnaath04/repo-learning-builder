import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import type { RepoNode } from '../lib/schema';
import { Mermaid } from './Mermaid';
import { TechCards } from './TechCards';
import { Icon } from './Icon';

function Dots({ n }: { n?: number }) {
  const c = Math.max(0, Math.min(3, n ?? 0));
  return c ? <span className="tree-imp" aria-label={`importance ${c}/3`}>{Array.from({ length: c }).map((_, i) => <i key={i} />)}</span> : null;
}

function Tree({ node, onSelect, selected }: { node: RepoNode; onSelect: (n: RepoNode) => void; selected?: string }) {
  return (
    <li>
      <button className={`tree-row${selected === node.path ? ' selected' : ''}`} onClick={() => onSelect(node)}>
        <Icon name={node.kind === 'dir' ? 'FolderTree' : 'FileCode'} size={14} />
        <span className="tree-name">{node.name}</span>
        {node.role && <span className="tree-role">{node.role}</span>}
        <Dots n={node.importance} />
      </button>
      {node.children && node.children.length > 0 && (
        <ul className="tree-children">{node.children.map((c) => <Tree key={c.path} node={c} onSelect={onSelect} selected={selected} />)}</ul>
      )}
    </li>
  );
}

export function RepositoryExplorer() {
  const { course, navigate } = useApp();
  const [selected, setSelected] = useState<RepoNode | null>(null);
  const arch = useMemo(() => course?.diagrams.find((d) => /arch|system|map/i.test(d.id) || /arch|system/i.test(d.title)) ?? course?.diagrams[0], [course]);
  const related = useMemo(() => {
    if (!selected || !course) return [];
    return course.modules.flatMap((m) => m.lessons)
      .filter((l) => (l.sources ?? []).some((s) => s.path === selected.path || s.path.startsWith(selected.path + '/')))
      .map((l) => ({ id: l.id, title: l.title }));
  }, [selected, course]);

  if (!course) return null;
  if (!course.repoMap && course.diagrams.length === 0 && course.technologies.length === 0) {
    return <div className="page"><div className="empty"><Icon name="FolderTree" size={26} /><p>This course is not based on a repository.</p></div></div>;
  }

  return (
    <div className="page reveal">
      <h1><Icon name="FolderTree" size={22} /> Repository explorer</h1>
      {arch && (
        <section className="section"><h2><Icon name="Network" size={18} /> Architecture map</h2><Mermaid code={arch.code} title={arch.title} /></section>
      )}
      {course.repoMap && (
        <section className="section">
          <h2><Icon name="Map" size={18} /> Directory map</h2>
          <p className="muted">Dots mark the files that matter most. Select anything to learn what it does.</p>
          <div className="explorer-grid">
            <ul className="tree"><Tree node={course.repoMap} onSelect={setSelected} selected={selected?.path} /></ul>
            <div className="component-panel">
              {selected ? (
                <>
                  <h3><Icon name={selected.kind === 'dir' ? 'FolderTree' : 'FileCode'} size={16} /> {selected.name}</h3>
                  <dl>
                    <dt>Path</dt><dd><code>{selected.path}</code></dd>
                    {selected.role && (<><dt>What it does</dt><dd>{selected.role}</dd></>)}
                    <dt>Related lessons</dt>
                    <dd>{related.length === 0 ? <span className="muted">None cite this path.</span> : (
                      <ul style={{ margin: 0, paddingLeft: '1rem' }}>{related.map((l) => (
                        <li key={l.id}><button className="link" onClick={() => navigate({ view: 'lesson', lessonId: l.id })}>{l.title}</button></li>
                      ))}</ul>
                    )}</dd>
                  </dl>
                </>
              ) : <p className="muted">Select a file or folder to see what it does and which lessons cover it.</p>}
            </div>
          </div>
        </section>
      )}
      {course.technologies.length > 0 && (
        <section className="section"><h2><Icon name="Cpu" size={18} /> Technology cards</h2><TechCards tech={course.technologies} /></section>
      )}
    </div>
  );
}
