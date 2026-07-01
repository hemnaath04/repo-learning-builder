#!/usr/bin/env node
// Emit a minimal, valid compact v2 course skeleton to fill in. Keeps generation
// consistent and reminds the author which fields the renderer already supplies.
// Usage: node scaffold-course.mjs <id> [title] [category] > course.json

function main() {
  const id = process.argv[2];
  if (!id) { console.error('Usage: node scaffold-course.mjs <id> [title] [category]'); process.exit(1); }
  const title = process.argv[3] || id;
  const category = process.argv[4] || 'topic';

  const skeleton = {
    schemaVersion: 2,
    meta: {
      id, title,
      subtitle: '', promise: '',
      sourceType: 'repository',
      sourceRef: '', sourceFingerprint: '',
      generatedAt: new Date().toISOString(),
      category,
      audience: 'Beginner', goal: 'Big picture', depth: 'standard', style: 'balanced',
      estimatedMinutes: 45,
      levels: ['eli10', 'beginner', 'intermediate', 'advanced'],
      defaultLevel: 'beginner',
      outcomes: ['You will be able to ...'],
    },
    theme: { name: 'auto' },
    settings: { locking: 'recommended' },
    registries: {
      concepts: { 'c-1': { name: 'Core idea', summary: 'One line.' } },
      sources: { 's-1': { path: 'README.md', note: 'orientation' } },
      tech: {},
      glossary: {},
      diagrams: {},
    },
    modules: [
      {
        id: 'm-story', title: 'The five-minute story', summary: '', icon: 'BookOpen',
        lessons: [
          {
            id: 'l-story', title: 'What is this?', archetype: 'story', est: 5, concepts: ['c-1'],
            // Fill these in. Placeholders keep the skeleton valid so
            // `scaffold-course.mjs | validate-course.mjs` passes out of the box.
            levels: { beginner: 'TODO: beginner explanation' },
            facets: { what: 'TODO', why: 'TODO', how: 'TODO', whatif: 'TODO' },
            analogy: 'TODO: an accurate analogy',
            sources: ['s-1'],
            quiz: [{ id: 'q-1', q: 'TODO: question?', options: ['TODO A', 'TODO B'], answer: 0, hint: 'TODO', why: 'TODO: why the answer is right' }],
            teachBack: 'TODO: teach-back prompt',
          },
        ],
      },
    ],
  };
  process.stdout.write(JSON.stringify(skeleton, null, 2) + '\n');
}

main();
