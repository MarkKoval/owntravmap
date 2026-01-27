import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import BottomSheet from "./BottomSheet.jsx";

describe("BottomSheet", () => {
  it("calls confirm and cancel", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const place = {
      lat: 50,
      lng: 30,
      title: "",
      note: "",
      setTitle: vi.fn(),
      setNote: vi.fn(),
    };

    render(
      <BottomSheet
        place={place}
        onConfirm={onConfirm}
        onCancel={onCancel}
        reduceMotion
      />
    );

    fireEvent.click(screen.getByText(/Confirm visited/i));
    fireEvent.click(screen.getByText(/Cancel/i));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
