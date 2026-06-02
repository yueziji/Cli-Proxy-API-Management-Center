import { useCallback, useEffect, useState } from 'react';

/**
 * 监测容器实际宽度,低于阈值时返回 true。
 * 基于 ResizeObserver,因此能响应侧边栏开合等不改变视口宽度的布局变化。
 * 返回 [isBelow, refCallback]。
 */
export function useContainerNarrow(
  threshold: number
): [boolean, (node: HTMLElement | null) => void] {
  const [element, setElement] = useState<HTMLElement | null>(null);
  const [isBelow, setIsBelow] = useState(false);

  const refCallback = useCallback((node: HTMLElement | null) => {
    setElement(node);
  }, []);

  useEffect(() => {
    if (!element) return;

    const update = () => {
      setIsBelow(element.clientWidth < threshold);
    };

    update();

    const observer = new ResizeObserver(update);
    observer.observe(element);

    return () => observer.disconnect();
  }, [element, threshold]);

  return [isBelow, refCallback];
}
