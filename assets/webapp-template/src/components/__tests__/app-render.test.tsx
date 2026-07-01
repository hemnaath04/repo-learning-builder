import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { AppProvider } from '../../context/AppContext';
import { App } from '../App';

// Static-render smoke test: the full tree renders to HTML without throwing.
describe('App static render', () => {
  const html = renderToStaticMarkup(
    <AppProvider>
      <App />
    </AppProvider>,
  );

  it('shows the course title and promise', () => {
    expect(html).toContain('Understanding ClaimFarm');
  });

  it('renders the learning path and a module', () => {
    expect(html).toContain('Your learning path');
    expect(html).toContain('The five-minute story');
  });

  it('renders the outcomes and nav chrome', () => {
    expect(html).toContain('You will be able to');
    expect(html).toContain('Skip to content');
  });
});
