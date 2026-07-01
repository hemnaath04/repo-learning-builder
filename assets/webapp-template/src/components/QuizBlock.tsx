import { useState } from 'react';
import type { QuizItem } from '../lib/schema';
import { useApp } from '../context/AppContext';
import { Markdown } from './Markdown';
import { Icon } from './Icon';

const PRAISE = ['Nice, first try.', 'Correct.', 'Exactly right.', 'You have got it.'];

export function QuizBlock({ quiz }: { quiz: QuizItem }) {
  const { progress, actions } = useApp();
  const attempts = progress.quizAttempts[quiz.id] ?? [];
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const isCorrect = selected !== null && selected === quiz.answerIndex;

  const submit = () => {
    if (selected === null) return;
    setSubmitted(true);
    actions.recordQuiz(quiz.id, selected, selected === quiz.answerIndex);
  };
  const tryAgain = () => {
    setSubmitted(false);
    setSelected(null);
    setShowHint(false);
  };

  const verdict = isCorrect
    ? attempts.length === 0
      ? PRAISE[0]
      : PRAISE[1]
    : 'Not quite, and that is completely fine. Here is why:';

  return (
    <fieldset className="quiz" aria-live="polite">
      <legend className="quiz-legend">
        <Icon name="HelpCircle" size={16} /> Knowledge check
      </legend>
      <div className="quiz-question">
        <Markdown text={quiz.question} />
      </div>
      <ul className="quiz-options">
        {quiz.options.map((opt, i) => {
          const chosen = selected === i;
          const correctOption = submitted && i === quiz.answerIndex;
          const wrongChoice = submitted && chosen && i !== quiz.answerIndex;
          return (
            <li key={i}>
              <label className={`quiz-option${chosen ? ' chosen' : ''}${correctOption ? ' correct' : ''}${wrongChoice ? ' wrong' : ''}`}>
                <input type="radio" name={`quiz-${quiz.id}`} checked={chosen} disabled={submitted} onChange={() => setSelected(i)} />
                <span>{opt}</span>
                {correctOption && <Icon name="Check" size={16} className="" aria-hidden />}
              </label>
            </li>
          );
        })}
      </ul>

      {!submitted && (
        <div className="quiz-actions">
          {quiz.hint && (
            <button type="button" className="btn ghost" onClick={() => setShowHint((v) => !v)}>
              <Icon name="Lightbulb" size={15} /> {showHint ? 'Hide hint' : 'Hint'}
            </button>
          )}
          <button type="button" className="btn primary" disabled={selected === null} onClick={submit}>
            Check answer
          </button>
        </div>
      )}

      {showHint && !submitted && quiz.hint && (
        <p className="quiz-hint">
          <strong>Hint:</strong> {quiz.hint}
        </p>
      )}

      {submitted && (
        <div className={`quiz-result ${isCorrect ? 'correct' : 'wrong'}`}>
          <p className="quiz-verdict">
            <Icon name={isCorrect ? 'PartyPopper' : 'Info'} size={16} /> {verdict}
          </p>
          <Markdown text={quiz.explanation} />
          <button type="button" className="btn ghost" onClick={tryAgain}>
            <Icon name="RotateCcw" size={15} /> Try again
          </button>
        </div>
      )}

      {attempts.length > 0 && <p className="quiz-attempts">Attempts: {attempts.length}</p>}
    </fieldset>
  );
}
