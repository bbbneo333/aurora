import * as _ from 'lodash';

type SortedInsertionComparator<T> = (elementA: T, elementB: T) => number;

export function updateSortedArray<T>(array: T[], element: T, comparator: SortedInsertionComparator<T>, order: number = -1) {
  let insertionIndex = -1;
  do {
    insertionIndex += 1;
  } while (!_.isNil(array[insertionIndex]) && comparator(array[insertionIndex], element) === order);

  array.splice(insertionIndex, 0, element);
}
