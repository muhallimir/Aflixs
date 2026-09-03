// Tests for the useDebounce hook. React 17 + @testing-library/react 9.x.

import React from "react";
import { render, act } from "@testing-library/react";
import useDebounce from "../hooks/useDebounce";

function Harness({ value, delay, onChange }) {
  const debounced = useDebounce(value, delay);
  React.useEffect(() => {
    onChange(debounced);
  }, [debounced, onChange]);
  return null;
}

describe("useDebounce", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  test("returns initial value immediately on mount", () => {
    const onChange = jest.fn();
    render(<Harness value="alpha" delay={300} onChange={onChange} />);
    expect(onChange).toHaveBeenLastCalledWith("alpha");
  });

  test("only updates after the delay has elapsed with no further changes", () => {
    const onChange = jest.fn();
    const { rerender } = render(
      <Harness value="a" delay={300} onChange={onChange} />
    );
    rerender(<Harness value="ab" delay={300} onChange={onChange} />);
    rerender(<Harness value="abc" delay={300} onChange={onChange} />);
    expect(onChange).toHaveBeenLastCalledWith("a");
    act(() => {
      jest.advanceTimersByTime(299);
    });
    expect(onChange).toHaveBeenLastCalledWith("a");
    act(() => {
      jest.advanceTimersByTime(2);
    });
    expect(onChange).toHaveBeenLastCalledWith("abc");
  });

  test("resetting the timer on rapid changes keeps the old value", () => {
    const onChange = jest.fn();
    const { rerender } = render(
      <Harness value="x" delay={500} onChange={onChange} />
    );
    rerender(<Harness value="xy" delay={500} onChange={onChange} />);
    act(() => {
      jest.advanceTimersByTime(300);
    });
    rerender(<Harness value="xyz" delay={500} onChange={onChange} />);
    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(onChange).toHaveBeenLastCalledWith("x");
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(onChange).toHaveBeenLastCalledWith("xyz");
  });
});