export function isElementEditable(element: Element | null): boolean {
  return !!element && (element instanceof HTMLInputElement
    || element instanceof HTMLTextAreaElement
    || (element instanceof HTMLElement && element.isContentEditable));
}
