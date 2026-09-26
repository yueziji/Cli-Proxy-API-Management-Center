type ScrollStrip = Pick<HTMLElement, 'scrollWidth' | 'clientWidth' | 'scrollLeft'>;
type StripWheelEvent = Pick<
  WheelEvent,
  'deltaX' | 'deltaY' | 'deltaMode' | 'ctrlKey' | 'defaultPrevented' | 'preventDefault'
>;

/** Map vertical wheels to the strip; preserve native horizontal gestures and zoom. */
export function scrollProviderTabs(strip: ScrollStrip, event: StripWheelEvent): void {
  const maxScroll = strip.scrollWidth - strip.clientWidth;
  if (
    event.ctrlKey ||
    event.defaultPrevented ||
    maxScroll <= 0 ||
    event.deltaY === 0 ||
    Math.abs(event.deltaX) > Math.abs(event.deltaY)
  ) {
    return;
  }

  const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? strip.clientWidth : 1;
  const nextScrollLeft = Math.max(
    0,
    Math.min(maxScroll, strip.scrollLeft + event.deltaY * unit)
  );
  if (nextScrollLeft === strip.scrollLeft) return;

  event.preventDefault();
  strip.scrollLeft = nextScrollLeft;
}
