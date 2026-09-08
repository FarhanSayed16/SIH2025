import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Card } from '../../components/ui/card';
import { IoTAlertModal } from '../../components/alerts/IoTAlertModal';

describe('Audited interactive components', () => {
  afterEach(() => vi.useRealTimers());

  it('forwards Card click handlers so modal content can stop backdrop clicks', () => {
    const backdropClick = vi.fn();
    const cardClick = vi.fn((event: React.MouseEvent<HTMLDivElement>) => event.stopPropagation());
    render(
      <div onClick={backdropClick}>
        <Card onClick={cardClick} aria-label="Dialog content">
          <button>Inside card</button>
        </Card>
      </div>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Inside card' }));
    expect(cardClick).toHaveBeenCalledOnce();
    expect(backdropClick).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Dialog content')).toBeInTheDocument();
  });

  it('can close and reopen an alert, clears the old dismissal timer, and stops content clicks', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    const alertData = { deviceId: 'flood-sensor', alertType: 'FLOOD', severity: 'HIGH', autoDismiss: true };
    const { rerender, container } = render(<IoTAlertModal alertData={alertData} isOpen onClose={onClose} />);
    fireEvent.click(screen.getByText('🌊 Flood Alert!'));
    expect(onClose).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(15000));
    rerender(<IoTAlertModal alertData={null} isOpen={false} onClose={onClose} />);
    act(() => vi.advanceTimersByTime(30000));
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.queryByText('🌊 Flood Alert!')).not.toBeInTheDocument();

    rerender(<IoTAlertModal alertData={alertData} isOpen onClose={onClose} />);
    expect(screen.getByText('🌊 Flood Alert!')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(30000));
    expect(onClose).toHaveBeenCalledOnce();
    fireEvent.click(container.firstElementChild!);
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
