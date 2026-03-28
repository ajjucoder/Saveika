import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SignalBreakdown } from '../components/chw/signal-breakdown';
import { LanguageProvider } from '../providers/language-provider';
import type { VisitResponses } from '../lib/types';

function renderSignalBreakdown(responses: VisitResponses) {
  return render(
    <LanguageProvider>
      <SignalBreakdown responses={responses} />
    </LanguageProvider>
  );
}

describe('SignalBreakdown legacy compatibility', () => {
  it('should default missing legacy fields to "Not observed" instead of rendering undefined', () => {
    const legacyResponses = {
      sleep: 1,
      appetite: 0,
      activities: 1,
      hopelessness: 0,
      withdrawal: 1,
      trauma: 0,
      substance: 0,
      self_harm: 0,
    } as VisitResponses;

    renderSignalBreakdown(legacyResponses);

    expect(screen.queryByText('undefined')).not.toBeInTheDocument();
    expect(screen.getByText('Visible fear, flashbacks, or extreme startle response')).toBeInTheDocument();
    expect(screen.getByText('Talking to self, strange beliefs, or confused speech')).toBeInTheDocument();
    expect(screen.getByText('Neglecting family due to substance use')).toBeInTheDocument();
    expect(screen.getByText('Expressed wish to die or not exist')).toBeInTheDocument();
  });
});
