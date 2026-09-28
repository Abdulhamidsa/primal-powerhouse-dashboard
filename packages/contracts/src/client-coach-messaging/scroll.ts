export function preserveScrollOffset(previousScrollTop: number, previousScrollHeight: number, nextScrollHeight: number): number {
  return previousScrollTop + (nextScrollHeight - previousScrollHeight);
}
