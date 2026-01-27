import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import BottomSheet from '../components/BottomSheet.jsx';

describe('BottomSheet', () => {
  it('calls confirm and cancel actions', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const onUpdate = vi.fn();

    render(
      <BottomSheet
        pendingPlace={{ lat: 50, lng: 30, title: '', note: '' }}
        onConfirm={onConfirm}
        onCancel={onCancel}
        onUpdate={onUpdate}
        reduceMotion
      />
    );

    fireEvent.change(screen.getByPlaceholderText('Add a label'), { target: { value: 'Kyiv' } });
    expect(onUpdate).toHaveBeenCalled();

    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalled();

    fireEvent.click(screen.getByText('Confirm visited'));
    expect(onConfirm).toHaveBeenCalled();
  });
});
