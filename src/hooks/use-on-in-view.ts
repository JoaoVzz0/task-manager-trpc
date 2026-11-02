import { useEffect, useRef, useState } from "react";

type Options = {
  /** Grows the viewport, so `onEnter` fires before the element is reached. */
  rootMargin?: string;
  /**
   * Changing it starts a fresh observation. Use it when content above the
   * element changes, so an element that is still visible triggers again.
   */
  resetKey?: unknown;
};

/**
 * Calls `onEnter` whenever the element comes into view. Returns a callback
 * ref, so observation follows the element even when it unmounts and renders
 * again.
 *
 * The callback is driven by observer events rather than by an "is in view"
 * state: right after new content renders, such a state still holds the old
 * reading, which would trigger one extra call.
 */
export function useOnInView<T extends Element>(
  onEnter: () => void,
  { rootMargin = "0px", resetKey }: Options = {},
) {
  const [element, setElement] = useState<T | null>(null);
  const onEnterRef = useRef(onEnter);

  useEffect(() => {
    onEnterRef.current = onEnter;
  });

  useEffect(() => {
    if (!element) return;
    // A new observer always reports the current position once, after layout.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) onEnterRef.current();
      },
      { rootMargin },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [element, rootMargin, resetKey]);

  return setElement;
}
