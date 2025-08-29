import { PointerSensor } from '@dnd-kit/core';

export class SafePointerSensor extends PointerSensor {
  static activators = [
    {
      eventName: 'onPointerDown' as const,
      // @ts-ignore
      handler: ({ nativeEvent }) => {
        const target = nativeEvent.target as HTMLElement;

        // Opt-out hook for any element
        if (target.closest('[data-dndkit-no-drag]')) return false;

        // Don’t start drag from interactive elements
        const tag = target.tagName.toLowerCase();
        return !['button', 'input', 'textarea', 'select', 'option', 'a'].includes(tag);
      },
    },
  ];
}
