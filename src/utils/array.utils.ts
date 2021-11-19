import * as _ from 'lodash';

type SortedInsertionComparator<T> = (elementA: T, elementB: T) => number;

export function updateSortedArray<T>(array: T[], element: T, comparator: SortedInsertionComparator<T>, order: number = -1) {
  let insertionIndex = -1;
  do {
    insertionIndex += 1;
  } while (!_.isNil(array[insertionIndex]) && comparator(array[insertionIndex], element) === order);

  array.splice(insertionIndex, 0, element);
}

/**
 * Shuffles elements within an array in place
 * @see - https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
 * @see - https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
 */
export function shuffleArray<T>(array: T[]): T[] {
  let currentIndex = array.length;
  let randomIndex;

  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    [
      // eslint-disable-next-line no-param-reassign
      array[currentIndex],
      // eslint-disable-next-line no-param-reassign
      array[randomIndex],
    ] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
}
