export function isElementEditable(element: Element): boolean {
  return element instanceof HTMLInputElement
    || element instanceof HTMLTextAreaElement
    || (element instanceof HTMLElement && element.isContentEditable);
}
