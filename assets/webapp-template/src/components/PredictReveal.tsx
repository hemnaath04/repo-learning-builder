import { useState } from 'react';
import type { Predict } from '../lib/schema';
import { Markdown } from './Markdown';
import { Icon } from './Icon';

// Commit to a guess before the mechanism is shown. Never graded: the value is
// in making the prediction, so a wrong guess costs nothing and is not stored.
export function PredictReveal({ data }: { data: Predict }) {
  const [picked, setPicked] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  return (
    <aside className="predict" aria-live="polite">
      <div className="predict-head">
        <Icon name="HelpCircle" size={16} /> <span>Make a prediction</span>
      </div>
      <div className="predict-q"><Markdown text={data.question} /></div>

      {data.options && !revealed && (
        <ul className="predict-options">
          {data.options.map((opt, i) => (
            <li key={i}>
              <button
                className={`predict-option${picked === i ? ' chosen' : ''}`}
                onClick={() => setPicked(i)}
                aria-pressed={picked === i}
              >
                {opt}
              </button>
            </li>
          ))}
        </ul>
      )}

      {!revealed ? (
        <button
          className="btn primary"
          onClick={() => setRevealed(true)}
          disabled={Boolean(data.options) && picked === null}
        >
          {data.options ? 'Lock it in and reveal' : 'I have a guess, reveal it'}
        </button>
      ) : (
        <div className="predict-reveal">
          {data.options && picked !== null && (
            <p className="predict-picked">Your guess: {data.options[picked]}</p>
          )}
          <Markdown text={data.reveal} />
        </div>
      )}
    </aside>
  );
}
