import moment from 'moment';

export function formatSecondsToMinutes(seconds: number): string {
  return moment
    .utc(seconds * 1000)
    .format('mm:ss');
}
