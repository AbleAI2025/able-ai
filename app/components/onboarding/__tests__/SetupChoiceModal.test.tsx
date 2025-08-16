import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SetupChoiceModal from '../SetupChoiceModal';

describe('SetupChoiceModal', () => {
  const mockOnChoice = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders when isOpen is true', () => {
    render(
      <SetupChoiceModal
        isOpen={true}
        onChoice={mockOnChoice}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('How would you like to set up your profile?')).toBeInTheDocument();
    expect(screen.getByText('AI-Assisted Setup')).toBeInTheDocument();
    expect(screen.getByText('Manual Form Input')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(
      <SetupChoiceModal
        isOpen={false}
        onChoice={mockOnChoice}
        onClose={mockOnClose}
      />
    );

    expect(screen.queryByText('How would you like to set up your profile?')).not.toBeInTheDocument();
  });

  it('calls onChoice with "ai" when AI-Assisted option is clicked', () => {
    render(
      <SetupChoiceModal
        isOpen={true}
        onChoice={mockOnChoice}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByText('AI-Assisted Setup'));
    expect(mockOnChoice).toHaveBeenCalledWith('ai');
  });

  it('calls onChoice with "manual" when Manual Form option is clicked', () => {
    render(
      <SetupChoiceModal
        isOpen={true}
        onChoice={mockOnChoice}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByText('Manual Form Input'));
    expect(mockOnChoice).toHaveBeenCalledWith('manual');
  });

  it('calls onClose when clicking outside the modal', () => {
    render(
      <SetupChoiceModal
        isOpen={true}
        onChoice={mockOnChoice}
        onClose={mockOnClose}
      />
    );

    const overlay = screen.getByRole('presentation');
    fireEvent.click(overlay);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('does not call onClose when clicking inside the modal content', () => {
    render(
      <SetupChoiceModal
        isOpen={true}
        onChoice={mockOnChoice}
        onClose={mockOnClose}
      />
    );

    const modalContent = screen.getByText('AI-Assisted Setup').closest('div');
    fireEvent.click(modalContent!);
    expect(mockOnClose).not.toHaveBeenCalled();
  });
});
