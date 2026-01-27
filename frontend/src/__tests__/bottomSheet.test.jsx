import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BottomSheet from '../components/BottomSheet.jsx';

describe('BottomSheet', () => {
  it('calls onConfirm with updated title', () => {
    const onConfirm = vi.fn();
    render(
      <BottomSheet
        place={{ lat: 50, lng: 30, title: '', note: '', source: 'click' }}
        onCancel={vi.fn()}
        onConfirm={onConfirm}
        reduceMotion={true}
      />
    );
    fireEvent.change(screen.getByLabelText('Назва'), { target: { value: 'Kyiv' } });
    fireEvent.click(screen.getByText('Підтвердити'));
    expect(onConfirm).toHaveBeenCalled();
    expect(onConfirm.mock.calls[0][0].title).toBe('Kyiv');
  });
});
