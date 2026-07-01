// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { WorkedExample } from '../WorkedExample';
import { ScenarioPlayer } from '../ScenarioPlayer';
import { PredictReveal } from '../PredictReveal';
import { Callout } from '../Callout';

afterEach(cleanup);

describe('WorkedExample', () => {
  const data = {
    intro: 'One input goes in.',
    steps: [
      { label: 'Arrives', state: [{ k: 'from', v: '+91' }] },
      { label: 'Assessed', state: [{ k: 'severity', v: '72' }] },
    ],
    outcome: 'A pending claim exists.',
  };

  it('steps through states and shows the outcome only at the end', () => {
    render(<WorkedExample data={data} />);
    expect(screen.getByText('Arrives')).toBeTruthy();
    expect(screen.getByText('+91')).toBeTruthy();
    expect(screen.queryByText('A pending claim exists.')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Next step/i }));
    expect(screen.getByText('Assessed')).toBeTruthy();
    expect(screen.getByText('72')).toBeTruthy();
    expect(screen.getByText('A pending claim exists.')).toBeTruthy();
    // replay returns to step 1
    fireEvent.click(screen.getByRole('button', { name: /Replay/i }));
    expect(screen.getByText('Arrives')).toBeTruthy();
  });

  it('auto-plays through the steps and stops at the end', () => {
    vi.useFakeTimers();
    render(<WorkedExample data={data} />);
    fireEvent.click(screen.getByRole('button', { name: 'Play' }));
    act(() => { vi.advanceTimersByTime(2300); });
    expect(screen.getByText('Assessed')).toBeTruthy();
    expect(screen.getByText('A pending claim exists.')).toBeTruthy();
    // stopped: the control reads Play again
    expect(screen.getByRole('button', { name: 'Play' })).toBeTruthy();
    vi.useRealTimers();
  });
});

describe('ScenarioPlayer', () => {
  const data = {
    prompt: 'Pick an input.',
    choices: [
      { label: 'Valid webhook', steps: ['verify', 'run pipeline'], outcome: 'Pipeline runs.' },
      { label: 'Forged request', steps: ['missing signature'], outcome: '403 returned.' },
    ],
  };

  it('plays the chosen branch and can reset', () => {
    render(<ScenarioPlayer data={data} />);
    expect(screen.queryByText('403 returned.')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Forged request/i }));
    expect(screen.getByText('missing signature')).toBeTruthy();
    expect(screen.getByText('403 returned.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Try another input/i }));
    expect(screen.queryByText('403 returned.')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Valid webhook/i }));
    expect(screen.getByText('Pipeline runs.')).toBeTruthy();
  });
});

describe('PredictReveal', () => {
  it('requires a committed option before revealing', () => {
    render(<PredictReveal data={{ question: 'What happens?', options: ['A', 'B'], reveal: 'B happens because reasons.' }} />);
    const lockIn = screen.getByRole('button', { name: /Lock it in/i });
    expect((lockIn as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'B' }));
    expect((lockIn as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(lockIn);
    expect(screen.getByText(/Your guess: B/)).toBeTruthy();
    expect(screen.getByText('B happens because reasons.')).toBeTruthy();
    // options are gone after the reveal
    expect(screen.queryByRole('button', { name: 'A' })).toBeNull();
  });

  it('works without options as a think-first prompt', () => {
    render(<PredictReveal data={{ question: 'Guess.', reveal: 'The answer.' }} />);
    fireEvent.click(screen.getByRole('button', { name: /reveal it/i }));
    expect(screen.getByText('The answer.')).toBeTruthy();
  });
});

describe('Callout', () => {
  it('renders the analogy mapping table and the misconception kind', () => {
    render(<Callout data={{ kind: 'analogy', body: 'Like a phone book.', pairs: [{ from: 'Name', to: 'Domain' }] }} />);
    expect(screen.getByText('In the story')).toBeTruthy();
    expect(screen.getByText('Domain')).toBeTruthy();
    render(<Callout data={{ kind: 'misconception', body: 'DNS serves pages.' }} />);
    expect(screen.getByText('Common misconception')).toBeTruthy();
  });
});
